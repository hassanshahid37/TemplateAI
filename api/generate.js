// /api/generate.js
// Nexora — Spine-aligned template generator (YT-ready)
// Goal: Always return REAL templates (canvas + elements) that the editor can render/export.
// Notes:
// - Deterministic per (prompt|category|style|i) so results are stable and debuggable.
// - No external APIs; fast local generation.
// - Embeds `doc` (spine canonical doc) inside each template for future Studio.

let Spine = null;
try{ Spine = require("./spine-core.js"); }catch{ Spine = require("../spine-core.js"); }

// ------------------------- tiny utils -------------------------
const str = (x)=>String(x==null?"":x);
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
function hash32(s){
  s = str(s);
  let h = 2166136261;
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h>>>0);
}
function pick(arr, seed){
  if(!Array.isArray(arr) || !arr.length) return null;
  return arr[(seed % arr.length + arr.length) % arr.length];
}
function safeJson(req){
  if(!req) return {};
  if(typeof req.body === "object" && req.body) return req.body;
  try { return JSON.parse(req.body||"{}"); } catch { return {}; }
}

// ------------------------- sizes -------------------------
const CATEGORIES = {
  "YouTube Thumbnail": { w: 1280, h: 720 },
  "Instagram Post": { w: 1080, h: 1080 },
  "Instagram Story": { w: 1080, h: 1920 },
  "Poster": { w: 1080, h: 1350 },
  "Flyer": { w: 1080, h: 1350 },
  "Presentation Slide": { w: 1920, h: 1080 },
  "Business Card": { w: 1050, h: 600 },
  "Resume": { w: 1240, h: 1754 },
};
function canvasForCategory(category){
  return CATEGORIES[category] || CATEGORIES["Instagram Post"];
}

// ------------------------- palette -------------------------
function paletteForStyle(style, seed){
  const s = str(style).toLowerCase();
  const glass = s.includes("glass") || s.includes("neon") || s.includes("premium");
  const dark = !s.includes("light") && !s.includes("white");

  // A few deterministic families.
  const families = [
    { name:"Obsidian", bg:"#070A14", bg2:"#111A35", accent:"#00E5FF", accent2:"#8B5CFF", ink:"#FFFFFF", muted:"rgba(255,255,255,0.78)", __glass:true },
    { name:"Abyss",    bg:"#050712", bg2:"#1A1233", accent:"#0B5FFF", accent2:"#FF4FA3", ink:"#FFFFFF", muted:"rgba(255,255,255,0.78)", __glass:true },
    { name:"NoirGold", bg:"#0A0A0C", bg2:"#1A1A1F", accent:"#F7C948", accent2:"#00D1B2", ink:"#FFFFFF", muted:"rgba(255,255,255,0.78)", __glass:false },
    { name:"Paper",    bg:"#F7F9FF", bg2:"#E8EEFF", accent:"#0B5FFF", accent2:"#FF4FA3", ink:"#0B1020", muted:"rgba(11,16,32,0.72)", __glass:false },
  ];

  let base = pick(families, seed ^ 0xA11CE);
  if(!dark) base = families[3]; // Paper
  if(glass && base) base = { ...base, __glass:true };
  return base || families[0];
}

// ------------------------- "smart photo" (SVG data URI) -------------------------
function smartPhotoSrc(seed, pal, label){
  // Creates a deterministic, good-looking abstract "photo" (data:image/svg+xml)
  const w = 1200, h = 800;
  const a = pal.accent || "#0B5FFF";
  const b = pal.accent2 || "#8B5CFF";
  const bg = pal.bg2 || "#111A35";
  const txt = str(label||"").slice(0,18).replace(/[^a-z0-9 _-]/ig,"").trim() || "NEXORA";
  const r1 = (seed % 360);
  const r2 = ((seed>>3) % 360);
  const x1 = 15 + (seed % 70);
  const y1 = 10 + ((seed>>2) % 60);
  const x2 = 35 + ((seed>>4) % 60);
  const y2 = 30 + ((seed>>6) % 50);
  const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${b}" stop-opacity="0.95"/>
    </linearGradient>
    <radialGradient id="g2" cx="${x1}%" cy="${y1}%" r="70%">
      <stop offset="0" stop-color="${b}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${bg}" stop-opacity="1"/>
    </radialGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${bg}"/>
  <circle cx="${x1}%" cy="${y1}%" r="340" fill="url(#g1)" filter="url(#blur)" opacity="0.85"/>
  <circle cx="${x2}%" cy="${y2}%" r="280" fill="url(#g2)" filter="url(#blur)" opacity="0.85"/>
  <g opacity="0.55">
    <path d="M-60 ${h*0.72} C ${w*0.22} ${h*0.62}, ${w*0.32} ${h*0.98}, ${w+60} ${h*0.76} L ${w+60} ${h+60} L -60 ${h+60} Z"
          fill="rgba(255,255,255,0.08)"/>
  </g>
  <g transform="translate(${w*0.08},${h*0.12}) rotate(${r1})" opacity="0.18">
    <rect x="0" y="0" width="${w*0.52}" height="${h*0.52}" rx="42" fill="rgba(255,255,255,0.12)"/>
  </g>
  <g transform="translate(${w*0.55},${h*0.15}) rotate(${r2})" opacity="0.15">
    <rect x="0" y="0" width="${w*0.38}" height="${h*0.38}" rx="36" fill="rgba(0,0,0,0.22)"/>
  </g>
  <text x="50%" y="88%" text-anchor="middle" font-family="Poppins,Arial" font-weight="900" font-size="74"
        fill="rgba(255,255,255,0.32)">${escapeXml(txt)}</text>
</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function escapeXml(s){
  return str(s).replace(/[<>&'"]/g, (c)=>({ "<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;" }[c]));
}

// ------------------------- content extraction -------------------------
function brandFromPrompt(prompt){
  const p = str(prompt);
  const m = p.match(/brand\s*[:\-]\s*([^\n,;]+)/i);
  const brand = (m ? m[1] : (p.split(/\s+/).slice(0,2).join(" "))) || "Nexora";
  return { brand: brand.trim().slice(0,24) || "Nexora" };
}
function headlineFromPrompt(prompt, seed){
  const p = str(prompt).trim();
  const m = p.match(/headline\s*[:\-]\s*([^\n]+)/i);
  if(m) return m[1].trim().slice(0,60);
  // deterministic "strong" headline
  const verbs = ["Boost","Unlock","Master","Create","Win","Grow","Transform","Dominate"];
  const nouns = ["Views","Sales","Design","Brand","Audience","Skills","Results","Momentum"];
  return `${pick(verbs, seed)} ${pick(nouns, seed^17)}`.slice(0,60);
}
function subheadFromPrompt(prompt, seed){
  const p = str(prompt).trim();
  const m = p.match(/subhead\s*[:\-]\s*([^\n]+)/i);
  if(m) return m[1].trim().slice(0,90);
  const opts = [
    "Clean layout • bold typography • premium feel",
    "Designed to stop the scroll and drive clicks",
    "Modern spacing • high contrast • strong CTA",
    "Looks expensive • easy to edit • ready to post",
  ];
  return pick(opts, seed^29);
}
function pickCTA(style, seed){
  const s = str(style).toLowerCase();
  const vibe = s.includes("sale") || s.includes("promo") ? "Urgency" : "Branding";
  const choices = {
    Branding: ["Learn More", "Discover", "Explore", "Get Started"],
    Urgency: ["Shop Now", "Limited Offer", "Buy Now", "Get 30% Off"],
    Info: ["See Details", "Learn More", "Read More", "Get Info"],
    CTA: ["Get Started", "Join Now", "Try Now", "Sign Up"],
  };
  return pick(choices[vibe] || choices.CTA, seed);
}

// ------------------------- layout selection -------------------------
function layoutForCategory(category, seed){
  const cat = str(category);
  if(cat === "YouTube Thumbnail"){
    // Make YT more “YouTube-ish”: big title + strong badge + face/hero card feel.
    return pick(["ytSplitHero","ytBigBadge","ytPhotoCard"], seed);
  }
  return pick(["splitHero","badgePromo","featureGrid","minimalQuote","photoCard"], seed);
}

// ------------------------- element composer (AC-V1 compatible) -------------------------
function buildElements(layout, spec){
  const { w, h, pal, brand, headline, subhead, cta, seed } = spec;
  const els = [];
  const add = (e)=>{ els.push(e); return e; };

  const pad = Math.round(Math.min(w,h)*0.07);
  const H1 = clamp(Math.round(h*0.10), 42, layout.startsWith("yt") ? 140 : 110);
  const H2 = clamp(Math.round(h*0.045), 20, 64);

  // background (as a dedicated element)
  add({ type:"bg", x:0,y:0,w,h, fill: pal.bg, fill2: pal.bg2, style:"radial" });

  // helpers
  const glassFill = pal.__glass ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.20)";
  const glassStroke = "rgba(255,255,255,0.16)";

  // "photo"
  const photoA = smartPhotoSrc(seed + 19, pal, brand);
  const photoB = smartPhotoSrc(seed + 77, pal, (headline.split(" ")[0]||brand));

  if(layout === "splitHero"){
    add({ type:"shape", x:0,y:0,w:Math.round(w*0.58),h, r:48, fill: pal.bg2, opacity:0.90 });
    add({ type:"shape", x:Math.round(w*0.54), y:Math.round(h*0.12), w:Math.round(w*0.40), h:Math.round(h*0.56), r:44, fill:"rgba(255,255,255,0.06)", stroke:"rgba(255,255,255,0.14)" });
    add({ type:"text", x:pad, y:pad, text: brand.toUpperCase(), size:clamp(Math.round(H2*0.9), 16, 44), weight:800, color: pal.muted, letter:2 });
    add({ type:"text", x:pad, y:pad + Math.round(H2*1.3), text: headline, size:H1, weight:900, color: pal.ink, letter:-0.6 });
    add({ type:"text", x:pad, y:pad + Math.round(H2*1.3) + Math.round(H1*1.18), text: subhead, size:H2, weight:650, color: pal.muted });
    add({ type:"pill", x:pad, y:h - pad - Math.round(H2*2.1), w:Math.round(w*0.32), h:Math.round(H2*2.1), r:999, fill: pal.accent, text: cta, tcolor:"#0b1020", tsize:clamp(Math.round(H2*0.95), 14, 36), tweight:900 });
    add({ type:"image", src: photoB, x:Math.round(w*0.62), y:h - pad - Math.round(h*0.30), w:Math.round(w*0.30), h:Math.round(h*0.24), r:24, stroke:"rgba(255,255,255,0.14)" });
  }

  if(layout === "badgePromo"){
    add({ type:"image", src: photoA, x:0,y:0,w,h, r:0, opacity:1 });
    add({ type:"shape", x:0,y:0,w,h, r:0, fill:"linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.62))", opacity:1 });
    add({ type:"shape", x:pad,y:pad,w:Math.round(w*0.52),h:Math.round(h*0.62), r:44, fill: glassFill, stroke: glassStroke, opacity:1 });
    add({ type:"pill", x:pad+18, y:pad+18, w:Math.round(w*0.22), h:Math.round(H2*1.6), r:999, fill: pal.accent2, text:"LIMITED", tcolor:"#0b1020", tsize:clamp(Math.round(H2*0.8), 12, 28), tweight:900 });
    add({ type:"text", x:pad+18, y:pad + Math.round(h*0.18), text: headline, size:clamp(Math.round(H1*0.90), 40, 120), weight:900, color: pal.ink, letter:-0.6 });
    add({ type:"text", x:pad+18, y:pad + Math.round(h*0.18) + Math.round(H1*1.02), text: subhead, size:H2, weight:650, color:"rgba(255,255,255,0.86)" });
    add({ type:"pill", x:pad+18, y:pad + Math.round(h*0.46), w:Math.round(w*0.28), h:Math.round(H2*2.1), r:999, fill: pal.accent, text: cta, tcolor:"#0b1020", tsize:clamp(Math.round(H2*0.95), 14, 36), tweight:900 });
    add({ type:"chip", x:pad+18, y:pad + Math.round(h*0.56), text: "@"+brand.toLowerCase().replace(/\s+/g,""), size:clamp(Math.round(H2*0.72), 11, 26), color:"rgba(255,255,255,0.72)" });
  }

  if(layout === "featureGrid"){
    add({ type:"shape", x:pad, y:pad, w:w-pad*2, h:Math.round(h*0.30), r:46, fill:"rgba(255,255,255,0.06)", stroke:"rgba(255,255,255,0.12)" });
    add({ type:"text", x:pad+16, y:pad+16, text: headline, size:clamp(Math.round(H1*0.92), 40, 120), weight:900, color: pal.ink });
    add({ type:"text", x:pad+18, y:pad+16 + Math.round(H1*1.05), text: subhead, size:H2, weight:650, color: pal.muted });

    const cardW = Math.round((w - pad*2 - 24) / 3);
    const top = Math.round(h*0.38);
    for (let k=0; k<3; k++){
      add({ type:"shape", x: pad + k*(cardW+12), y: top, w: cardW, h: Math.round(h*0.26), r: 26, fill: "rgba(255,255,255,0.05)", stroke:"rgba(255,255,255,0.10)" });
      add({ type:"shape", x: pad + k*(cardW+12) + 14, y: top + 14, w: Math.round(cardW*0.34), h: Math.round(cardW*0.34), r: 18, fill: k===0?pal.accent:(k===1?pal.accent2:pal.bg2), opacity:0.92 });
      add({ type:"text", x: pad + k*(cardW+12) + 14, y: top + Math.round(cardW*0.42) + 18, text: ["Fast","Clean","Ready"][k], size: clamp(Math.round(H2*0.95), 16, 46), weight: 900, color: pal.ink });
    }

    add({ type:"pill", x: pad, y: h - pad - Math.round(H2*2.1), w: Math.round(w*0.32), h: Math.round(H2*2.1), r: 999, fill: pal.accent, text: cta, tcolor:"#0b1020", tsize: clamp(Math.round(H2*0.95), 14, 36), tweight: 900 });
    add({ type:"image", src: photoB, x: Math.round(w*0.62), y: h - pad - Math.round(h*0.30), w: Math.round(w*0.30), h: Math.round(h*0.24), r: 24, stroke:"rgba(255,255,255,0.14)" });
  }

  if(layout === "minimalQuote"){
    const quote = headline;
    add({ type:"shape", x:pad, y:pad, w:w-pad*2, h:h-pad*2, r:56, fill: glassFill, stroke: glassStroke, opacity:1 });
    add({ type:"text", x:pad+26, y:pad+26, text: "“"+quote+"”", size:clamp(Math.round(H1*0.80), 38, 110), weight:900, color: pal.ink, letter:-0.4 });
    add({ type:"text", x:pad+26, y:pad+26 + Math.round(H1*1.15), text: subhead, size:H2, weight:650, color: pal.muted });
    add({ type:"pill", x:pad+26, y:h - pad - Math.round(H2*2.1), w:Math.round(w*0.30), h:Math.round(H2*2.1), r:999, fill: pal.accent2, text: cta, tcolor:"#0b1020", tsize:clamp(Math.round(H2*0.95), 14, 36), tweight:900 });
  }

  if(layout === "photoCard"){
    add({ type:"image", src: photoA, x: pad, y: pad, w: w - pad*2, h: Math.round(h*0.62), r: 46, stroke:"rgba(255,255,255,0.16)" });
    add({ type:"shape", x: pad, y: Math.round(h*0.62) - 8, w: w - pad*2, h: h - Math.round(h*0.62) - pad + 8, r: 46, fill: pal.__glass ? "rgba(15,18,32,0.55)" : "rgba(0,0,0,0.38)", stroke:"rgba(255,255,255,0.12)" });
    add({ type:"text", x: pad + 18, y: Math.round(h*0.66), text: headline, size: clamp(Math.round(H1*0.92), 38, 110), weight: 900, color: pal.ink });
    add({ type:"text", x: pad + 18, y: Math.round(h*0.66) + Math.round(H1*1.05), text: subhead, size: H2, weight: 650, color: pal.muted });
    add({ type:"pill", x: pad + 18, y: h - pad - Math.round(H2*2.1), w: Math.round(w*0.34), h: Math.round(H2*2.1), r: 999, fill: pal.accent2, text: cta, tcolor:"#0b1020", tsize: clamp(Math.round(H2*0.95), 14, 36), tweight: 900 });
  }

  // YT specialized
  if(layout === "ytSplitHero"){
    const side = Math.round(w*0.42);
    add({ type:"shape", x:0,y:0,w:w,h:h, r:0, fill: pal.bg, fill2: pal.bg2, style:"radial" });
    add({ type:"image", src: photoA, x:w-side, y:0, w:side, h:h, r:0, opacity:1 });
    add({ type:"shape", x:w-side, y:0, w:side, h:h, r:0, fill:"linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.10))" });
    add({ type:"pill", x:pad, y:pad, w:Math.round(w*0.20), h:Math.round(H2*1.7), r:999, fill: pal.accent, text:"NEW", tcolor:"#0b1020", tsize:clamp(Math.round(H2*0.9), 14, 30), tweight:900 });
    add({ type:"text", x:pad, y:pad + Math.round(H2*2.0), text: headline.toUpperCase(), size:clamp(Math.round(h*0.18), 70, 170), weight:900, color:"#ffffff", letter:-1.2 });
    add({ type:"text", x:pad, y:pad + Math.round(H2*2.0) + Math.round(h*0.30), text: subhead, size:clamp(Math.round(h*0.060), 24, 72), weight:800, color:"rgba(255,255,255,0.88)" });
  }
  if(layout === "ytBigBadge"){
    add({ type:"image", src: photoB, x:0,y:0,w,h, r:0, opacity:1 });
    add({ type:"shape", x:0,y:0,w,h, r:0, fill:"linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.72))", opacity:1 });
    add({ type:"pill", x:pad, y:pad, w:Math.round(w*0.26), h:Math.round(h*0.12), r:999, fill: pal.accent2, text:"SHOCKING", tcolor:"#0b1020", tsize:clamp(Math.round(h*0.07), 28, 62), tweight:900 });
    add({ type:"text", x:pad, y:Math.round(h*0.28), text: headline.toUpperCase(), size:clamp(Math.round(h*0.20), 76, 180), weight:900, color:"#ffffff", letter:-1.4 });
    add({ type:"text", x:pad, y:Math.round(h*0.64), text: subhead, size:clamp(Math.round(h*0.07), 24, 80), weight:900, color:"rgba(255,255,255,0.88)" });
  }
  if(layout === "ytPhotoCard"){
    add({ type:"shape", x:0,y:0,w,h, r:0, fill: pal.bg, fill2: pal.bg2, style:"radial" });
    add({ type:"image", src: photoA, x:Math.round(w*0.56), y:Math.round(h*0.10), w:Math.round(w*0.38), h:Math.round(h*0.72), r:44, stroke:"rgba(255,255,255,0.18)" });
    add({ type:"shape", x:Math.round(w*0.06), y:Math.round(h*0.12), w:Math.round(w*0.46), h:Math.round(h*0.70), r:48, fill: glassFill, stroke: glassStroke, opacity:1 });
    add({ type:"text", x:Math.round(w*0.09), y:Math.round(h*0.20), text: headline.toUpperCase(), size:clamp(Math.round(h*0.18), 70, 170), weight:900, color:"#ffffff", letter:-1.1 });
    add({ type:"pill", x:Math.round(w*0.09), y:Math.round(h*0.56), w:Math.round(w*0.26), h:Math.round(h*0.12), r:999, fill: pal.accent, text: cta.toUpperCase(), tcolor:"#0b1020", tsize:clamp(Math.round(h*0.07), 24, 62), tweight:900 });
    add({ type:"chip", x:Math.round(w*0.09), y:Math.round(h*0.70), text: brand.toUpperCase(), size:clamp(Math.round(h*0.06), 18, 60), color:"rgba(255,255,255,0.85)" });
  }

  return els;
}

function materializeTemplate({ prompt, category, style, i }){
  const baseSeed = hash32(`${prompt}|${category}|${style}|${i}`);
  const size = canvasForCategory(category);
  const pal = paletteForStyle(style, baseSeed);
  const brand = brandFromPrompt(prompt).brand;
  const headline = headlineFromPrompt(prompt, baseSeed);
  const subhead = subheadFromPrompt(prompt, baseSeed);
  const cta = pickCTA(style, baseSeed);

  const layout = layoutForCategory(category, baseSeed ^ 0xA5A5);
  const elements = buildElements(layout, { w:size.w, h:size.h, pal, brand, headline, subhead, cta, seed: baseSeed });

  return {
    id: `t_${baseSeed.toString(16)}`,
    title: headline,
    description: subhead,
    category,
    style,
    canvas: { w:size.w, h:size.h },
    elements,
    _layout: layout,
    _palette: pal.name || "Custom",
    _seed: baseSeed,
  };
}

// ------------------------- export-safe element normalization -------------------------
// Editor export currently supports: text + image + bg/shape via our added draw support.
// Ensure every element has the fields the editor expects.
function normalizeElements(elements){
  const out = [];
  for(const e of (Array.isArray(elements)?elements:[])){
    if(!e || !e.type) continue;
    const t = String(e.type).toLowerCase();
    const id = e.id || `el_${hash32(JSON.stringify(e)).toString(16)}`;
    if(t === "photo"){ // legacy
      out.push({ id, type:"image", x:e.x||0,y:e.y||0,w:e.w||100,h:e.h||100, src:e.src||null, radius:e.r??e.radius??24, opacity:e.opacity??1, fit:e.fit||"cover", bg:e.bg||"transparent" });
      continue;
    }
    if(t === "image"){
      out.push({ id, type:"image", x:e.x||0,y:e.y||0,w:e.w||100,h:e.h||100, src:e.src||null, radius:e.r??e.radius??24, opacity:e.opacity??1, fit:e.fit||"cover", bg:e.bg||"transparent" });
      continue;
    }
    // Keep type as-is; editor draw/export now supports these
    out.push({
      id,
      type: e.type,
      x: Number(e.x||0), y: Number(e.y||0),
      w: Number(e.w||0), h: Number(e.h||0),
      r: e.r, radius: e.radius, opacity: e.opacity,
      fill: e.fill, fill2: e.fill2, style: e.style,
      stroke: e.stroke,
      text: e.text, title: e.title, sub: e.sub,
      size: e.size, fontSize: e.fontSize, weight: e.weight, fontWeight: e.fontWeight,
      color: e.color, tcolor: e.tcolor, tsize: e.tsize, tweight: e.tweight,
      letter: e.letter,
    });
  }
  return out;
}

// ------------------------- handler -------------------------
module.exports = async (req, res) => {
  try{
    res.setHeader("Content-Type","application/json");
    res.setHeader("Cache-Control","no-store");

    if (req.method && req.method.toUpperCase() !== "POST"){
      res.statusCode = 405;
      return res.end(JSON.stringify({ error:"Method Not Allowed" }));
    }

    const body = safeJson(req);
    const prompt = str(body.prompt);
    const category = str(body.category || "YouTube Thumbnail");
    const style = str(body.style || "Dark Premium");
    const notes = str(body.notes || "");
    const count = clamp(Number(body.count ?? 6) || 6, 1, 24);

    // Build templates (visuals) + embed spine doc per template
    const templates = [];
    for(let i=0;i<count;i++){
      const t = materializeTemplate({ prompt, category, style, i });

      // Spine doc: same seed used so doc/template are coupled
      const doc = Spine.runCore({ prompt, notes, category, style, seed: t._seed }, { debug:false });

      templates.push({
        ...t,
        elements: normalizeElements(t.elements),
        doc
      });
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({ templates }));
  } catch (err){
    res.statusCode = 500;
    return res.end(JSON.stringify({ error:"Internal Error", message: String(err && err.message || err) }));
  }
};
