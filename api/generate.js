// /api/generate.js
// Nexora - serverless API endpoint.
//
// Goals:
// - NEVER throw, NEVER 500. Always return JSON.
// - Broad compatibility: Vercel Node / Netlify / generic serverless (CommonJS).
// - Supports two modes:
//    * mode:"copy"      -> returns copy fields (title/description/cta/badge) for merging into client templates
//    * mode:"templates" -> returns full templates (canvas + elements) using AC-V1 materializer
//
// NOTE: index.html currently calls this endpoint with mode:"copy" (fire-and-forget).

"use strict";

// Optional Spine integration (keeps spine-first contract intact when available).
let Spine = null;
try { Spine = require("./spine-core.js"); }
catch (_) { try { Spine = require("../spine-core.js"); } catch (__){ Spine = null; } }

function sendJSON(res, statusCode, obj){
  try{
    if (typeof res.setHeader === "function") res.setHeader("Content-Type", "application/json; charset=utf-8");
    if (typeof res.status === "function") res.status(statusCode);
    else res.statusCode = statusCode;

    if (typeof res.json === "function") return res.json(obj);
    if (typeof res.end === "function") return res.end(JSON.stringify(obj));
  }catch(_){}
  return undefined;
}

function safeReadBody(req){
  // If the platform already parsed the body (e.g. Next.js), use it.
  if (req && req.body != null){
    if (typeof req.body === "object") return Promise.resolve(req.body);
    if (typeof req.body === "string"){
      try { return Promise.resolve(JSON.parse(req.body || "{}")); }
      catch(_) { return Promise.resolve({}); }
    }
  }

  // Otherwise, stream-read (generic serverless).
  return new Promise((resolve) => {
    try{
      let data = "";
      req.on("data", (c) => { data += c; });
      req.on("end", () => {
        if(!data) return resolve({});
        try { resolve(JSON.parse(data)); } catch(_) { resolve({}); }
      });
      req.on("error", () => resolve({}));
    }catch(_){
      resolve({});
    }
  });
}

function clampInt(n, lo, hi, fallback){
  const x = Number.isFinite(n) ? n : parseInt(String(n ?? ""), 10);
  const v = Number.isFinite(x) ? x : fallback;
  return Math.max(lo, Math.min(hi, Math.floor(v)));
}

function words(s){
  return String(s||"").trim().split(/\s+/).filter(Boolean);
}

function titleCase(s){
  return String(s||"")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 12)
    .map(w => w ? (w[0].toUpperCase() + w.slice(1).toLowerCase()) : w)
    .join(" ");
}

function pick(list, i){
  return list[i % list.length];
}

function makeCopy({ category, style, prompt, notes }, i){
  const cat = String(category || "Template");
  const vibe = String(style || "Modern").trim() || "Modern";
  const raw = String(prompt || notes || "").trim();

  const isYT = cat.toLowerCase().includes("youtube");
  const cleaned = raw
    .replace(/^[\s\-–—:]+/g, "")
    .replace(/\?+$/g, "")
    .trim();

  let head = cleaned || (isYT ? "WATCH THIS" : `${cat} Idea`);
  const w = words(head);
  if (w.length > (isYT ? 7 : 10)) head = w.slice(0, isYT ? 7 : 10).join(" ");
  if (head.length > (isYT ? 34 : 48)) head = head.slice(0, isYT ? 34 : 48).trim();

  const title = titleCase(head);

  const descOptions = isYT
    ? [
        `${vibe} • bold hook • high contrast`,
        `${vibe} • clear promise • click-worthy`,
        `${vibe} • strong face zone • big text`,
        `${vibe} • 3-word punch • bright accent`,
      ]
    : [
        `${vibe} • clean layout • ready to edit`,
        `${vibe} • bold typography • high contrast`,
        `${vibe} • premium spacing • modern shapes`,
        `${vibe} • fast conversion • clear CTA`,
      ];

  const ctaOptions = isYT
    ? ["WATCH NOW", "FULL VIDEO", "DON'T MISS", "NEW", "MUST SEE", "CLICK"]
    : ["Get Started", "Learn More", "Explore", "Join Now", "Shop Now", "Download"];

  const badgeOptions = isYT
    ? ["NEW", "SHOCKING", "TRUTH", "OMG", "HIDDEN", "PRO"]
    : ["NEW", "LIMITED", "PRO", "SALE", "PREMIUM", "HOT"];

  return {
    title: title || (isYT ? "WATCH THIS" : "Premium Template"),
    description: pick(descOptions, i),
    cta: pick(ctaOptions, i),
    badge: pick(badgeOptions, i),
    category: cat,
    style: vibe
  };
}

module.exports = async function handler(req, res){
  // CORS / preflight safety (never block).
  try{
    if (typeof res.setHeader === "function"){
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
  }catch(_){}

  try{
    if (req.method === "OPTIONS") return sendJSON(res, 200, { success:true, templates: [] });
    if (req.method !== "POST") return sendJSON(res, 200, { success:true, templates: [] });

    const body = await safeReadBody(req);

    const category = String(body?.category || "Instagram Post");
    const style = String(body?.style || "Dark Premium");
    const prompt = String(body?.prompt || "");
    const notes = String(body?.notes || "");
    const mode = String(body?.mode || "copy").toLowerCase();
    const count = clampInt(body?.count, 1, 200, 12);

    // Deterministic divergence/variant index (optional).
    const divergenceIndexRaw = body?.divergenceIndex ?? body?.forkIndex ?? body?.variantIndex ?? body?.i;
    let divergenceIndex = Number(divergenceIndexRaw);
    if (!Number.isFinite(divergenceIndex)) divergenceIndex = -1;

    // MODE: copy (default) - return only copy fields for safe merge.
    if (mode === "copy" || mode === "ai" || mode === "text"){
      const templates = [];
      for (let i = 0; i < count; i++){
        templates.push(makeCopy({ category, style, prompt, notes }, i + 1));
      }
      return sendJSON(res, 200, { success:true, templates });
    }

    // MODE: templates - full templates (canvas + elements)
    const templates = makeTemplates({ prompt, category, style, count, divergenceIndex });

    // Spine docking: embed doc when spine exists (non-breaking for current UI).
    if (Spine && typeof Spine.createTemplateFromInput === "function"){
      for (let i=0;i<templates.length;i++){
        const t = templates[i];
        try{
          const seed = (t && t._seed != null) ? t._seed : undefined;
          const out = Spine.createTemplateFromInput({ category, style, prompt, notes, seed }, { debug:false });
          if (out && out.doc) t.doc = out.doc;
        }catch(_){}
      }
    }

    return sendJSON(res, 200, { success:true, templates });
  }catch(err){
    // Hard-safe: NEVER 500
    try{
      const templates = [];
      const fallbackCount = 6;
      for (let i=0;i<fallbackCount;i++){
        templates.push(makeCopy({ category:"Instagram Post", style:"Dark Premium", prompt:"", notes:"" }, i+1));
      }
      return sendJSON(res, 200, { success:true, templates, error: String(err && err.message ? err.message : err) });
    }catch(_){
      return sendJSON(res, 200, { success:true, templates: [] });
    }
  }
}



