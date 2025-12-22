// Nexora / Templify – Serverless template generator (real elements, safe)
// HARD SAFE VERSION: never calls OpenAI, never throws, never returns 500.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ success: true, templates: [] });
  }

  let body = {};
  try {
    body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
  } catch {
    body = {};
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const category = typeof body.category === "string" ? body.category : "Instagram Post";
  const style = typeof body.style === "string" ? body.style : "Dark Premium";
  const count = clampInt(body.count, 24, 1, 200);
  const mode = typeof body.mode === "string" ? body.mode : "templates";

  // If the frontend calls mode:"copy" (fire-and-forget), respond with a tiny structured suggestion
  // while still including templates for future compatibility.
  const copy = mode === "copy" ? makeCopy(prompt, category) : null;

  const templates = makeTemplates({ prompt, category, style, count });

  return res.status(200).json({
    success: true,
    copy,
    templates
  });
}

function clampInt(v, def, min, max) {
  const n = typeof v === "number" ? v : parseInt(v, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function hash(s) {
  s = String(s || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const CATEGORIES = {
  "Instagram Post": { w: 1080, h: 1080, ratio: "1:1" },
  "Story": { w: 1080, h: 1920, ratio: "9:16" },
  "YouTube Thumbnail": { w: 1280, h: 720, ratio: "16:9" },
  "Flyer": { w: 1080, h: 1350, ratio: "4:5" },
  "Business Card": { w: 1050, h: 600, ratio: "7:4" },
  "Logo": { w: 1000, h: 1000, ratio: "1:1" },
  "Presentation Slide": { w: 1920, h: 1080, ratio: "16:9" },
  "Resume": { w: 1240, h: 1754, ratio: "A4-ish" },
  "Poster": { w: 1414, h: 2000, ratio: "A3-ish" }
};

const PALETTES = [
  { name: "Cobalt Night", bg: "#0b1020", bg2: "#0a2a5a", ink: "#f7f9ff", muted: "#b9c3d6", accent: "#2f7bff", accent2: "#9b5cff" },
  { name: "Emerald Studio", bg: "#071613", bg2: "#0b3a2b", ink: "#f4fffb", muted: "#b9d7cc", accent: "#2dd4bf", accent2: "#84cc16" },
  { name: "Sunset Premium", bg: "#140a12", bg2: "#3b0f2b", ink: "#fff6fb", muted: "#f3cfe0", accent: "#fb7185", accent2: "#f59e0b" },
  { name: "Mono Luxe", bg: "#0b0c10", bg2: "#1a1d29", ink: "#f6f7fb", muted: "#b4bbcb", accent: "#e5e7eb", accent2: "#60a5fa" }
];

function pick(arr, seed) {
  return arr[(seed % arr.length + arr.length) % arr.length];
}

function brandFromPrompt(prompt) {
  const p = (prompt || "").trim();
  if (!p) return { brand: "Nexora", tagline: "Premium templates, fast." };
  const words = p.replace(/\s+/g, " ").split(" ").filter(Boolean);
  const brand = words.slice(0, 3).join(" ");
  const tagline = words.slice(3, 10).join(" ") || "Designed for your next post.";
  return { brand, tagline };
}

function classifyIntent(prompt, category, style) {
  const p = (prompt || "").toLowerCase();
  const has = (arr) => arr.some((k) => p.includes(k));
  const intent = { type: "generic", ctaMode: "generic" };

  if (has(["hiring", "we are hiring", "job", "jobs", "vacancy", "career", "apply", "join our team", "recruit"])) {
    intent.type = "hiring"; intent.ctaMode = "hiring";
  } else if (has(["sale", "discount", "%", "off", "limited", "offer", "deal", "flash", "promo", "promotion", "clearance"])) {
    intent.type = "promo"; intent.ctaMode = "promo";
  } else if (has(["launch", "new", "update", "announcement", "announcing", "introducing", "event", "webinar", "workshop", "meetup", "conference"])) {
    intent.type = "announcement"; intent.ctaMode = "info";
  } else if (has(["quote", "motiv", "inspir", "mindset", "success", "dream", "life"]) || (p.split(/\s+/).filter(Boolean).length <= 6 && !has(["sale", "discount", "hiring", "job"]))) {
    intent.type = "quote"; intent.ctaMode = "brand";
  }

  // small category dampening
  const cat = (category || "").toLowerCase();
  if (cat.includes("resume") || cat.includes("presentation")) {
    if (intent.type === "promo") intent.type = "announcement";
  }
  return intent;
}

function paletteForStyle(style, seed, intent) {
  const sname = String(style || "Dark Premium").toLowerCase();
  const base = pick(PALETTES, seed);
  let pal = { ...base };

  if (sname.includes("light")) {
    pal.bg = "#f8fafc";
    pal.bg2 = "#eef2ff";
    pal.ink = "#0b1220";
    pal.muted = "#334155";
  } else if (sname.includes("corporate")) {
    pal.bg = "#071423";
    pal.bg2 = "#0b2a4a";
    pal.ink = "#f3f7ff";
    pal.muted = "#b8c7dd";
    pal.accent = "#38bdf8";
    pal.accent2 = "#a78bfa";
  } else if (sname.includes("neon")) {
    pal.bg = "#05040a";
    pal.bg2 = "#130a2a";
    pal.ink = "#ffffff";
    pal.muted = "#c7c3ff";
    pal.accent = "#22d3ee";
    pal.accent2 = "#fb7185";
  } else if (sname.includes("glass")) {
    pal.__glass = true;
  }

  const t = intent?.type;
  if (t === "hiring") { pal.accent = "#60a5fa"; pal.accent2 = "#34d399"; }
  if (t === "promo") { pal.accent = pal.accent2 || pal.accent; }

  return pal;
}

function pickCTA(intent, seed) {
  const t = intent?.ctaMode || "generic";
  const s = (seed ^ hash("cta|" + t)) >>> 0;
  const choices = {
    hiring: ["Apply Now", "View Roles", "Join Our Team", "Send CV"],
    promo: ["Shop Now", "Get 30% Off", "Limited Offer", "Buy Now"],
    info: ["Learn More", "Read More", "Get Details"],
    brand: ["Discover", "Explore", "Get Started"],
    generic: ["Get Started", "Learn More", "Join Now"]
  };
  const list = choices[t] || choices.generic;
  return pick(list, s);
}

function archetypeWithIntent(seed, intent) {
  const base = [
    { name: "Split Hero", layout: "splitHero" },
    { name: "Badge Promo", layout: "badgePromo" },
    { name: "Minimal Quote", layout: "minimalQuote" },
    { name: "Feature Grid", layout: "featureGrid" },
    { name: "Big Number", layout: "bigNumber" },
    { name: "Photo Card", layout: "photoCard" }
  ];
  const t = intent?.type || "generic";
  const s = (seed ^ hash("intent|" + t)) >>> 0;
  const w = {
    generic:     { splitHero: 18, badgePromo: 14, minimalQuote: 10, featureGrid: 14, bigNumber: 12, photoCard: 12 },
    promo:       { splitHero: 12, badgePromo: 22, minimalQuote:  6, featureGrid: 12, bigNumber: 22, photoCard: 10 },
    hiring:      { splitHero: 20, badgePromo:  6, minimalQuote:  8, featureGrid: 22, bigNumber: 10, photoCard: 14 },
    announcement:{ splitHero: 18, badgePromo: 10, minimalQuote: 10, featureGrid: 16, bigNumber: 10, photoCard: 18 },
    quote:       { splitHero: 10, badgePromo:  6, minimalQuote: 30, featureGrid: 10, bigNumber: 10, photoCard: 12 }
  }[t] || null;

  let total = 0;
  const weights = base.map(a => {
    const ww = w ? (w[a.layout] ?? 10) : 10;
    total += ww;
    return { a, ww };
  });
  let r = (s / 4294967296) * total;
  for (const it of weights) {
    r -= it.ww;
    if (r <= 0) return it.a;
  }
  return weights[weights.length - 1].a;
}

function adStylePass(elements, spec, layout){
  if(!Array.isArray(elements) || !spec) return elements;
  const { w, h, pal, intent } = spec;
  const t = intent?.type || "generic";
  const a = pal?.accent || "#2f7bff";
  const b = pal?.accent2 || "#9b5cff";

  const frame = {
    type:"shape",
    x: Math.round(w*0.04),
    y: Math.round(h*0.04),
    w: Math.round(w*0.92),
    h: Math.round(h*0.92),
    r: Math.round(Math.min(w,h)*0.05),
    fill: "rgba(255,255,255,0.00)",
    stroke: "rgba(255,255,255,0.12)"
  };
  const glow1 = { type:"shape", x:Math.round(w*-0.08), y:Math.round(h*-0.10), w:Math.round(w*0.62), h:Math.round(h*0.44), r:Math.round(Math.min(w,h)*0.22), fill: a, opacity:0.10 };
  const glow2 = { type:"shape", x:Math.round(w*0.55), y:Math.round(h*0.60), w:Math.round(w*0.58), h:Math.round(h*0.48), r:Math.round(Math.min(w,h)*0.22), fill: b, opacity:0.10 };
  const rail = {
    type:"shape",
    x: Math.round(w*0.08),
    y: Math.round(h*0.22),
    w: Math.round(w*0.01),
    h: Math.round(h*0.56),
    r: 999,
    fill: "rgba(255,255,255,0.00)",
    stroke: (t==="promo" ? a : "rgba(255,255,255,0.14)")
  };

  const bgIndex = Math.max(0, elements.findIndex(e => String(e?.type||"").toLowerCase()==="bg"));
  const at = (bgIndex>=0? bgIndex+1 : 0);

  const pack = (layout==="minimalQuote")
    ? [glow1, frame]
    : (t==="promo")
      ? [glow1, glow2, rail, frame]
      : [glow1, glow2, frame];

  elements.splice(at, 0, ...pack);
  return elements;
}

function buildElements(layout, spec) {
  const { w, h, pal, brand, tagline, seed, intent } = spec;
  const elements = [];
  const add = (el) => { elements.push(el); return el; };

  add({ type: "bg", x: 0, y: 0, w, h, fill: pal.bg, fill2: pal.bg2, style: "radial" });

  if (layout === "splitHero") {
    add({ type: "shape", x: 0, y: 0, w: Math.round(w * 0.58), h, r: 48, fill: pal.bg2, opacity: 0.88 });
    add({ type: "shape", x: Math.round(w * 0.53), y: Math.round(h * 0.10), w: Math.round(w * 0.42), h: Math.round(h * 0.55), r: 48, stroke: "rgba(255,255,255,0.14)", fill: "rgba(255,255,255,0.04)" });
    add({ type: "text", x: Math.round(w * 0.07), y: Math.round(h * 0.14), text: String(brand || "Nexora").toUpperCase(), size: Math.round(h * 0.055), weight: 800, color: pal.ink, letter: -0.5 });
    add({ type: "text", x: Math.round(w * 0.07), y: Math.round(h * 0.25), text: (intent?.type==="hiring" ? "WE'RE HIRING" : "NEW COLLECTION"), size: Math.round(h * 0.03), weight: 700, color: pal.muted, letter: 2 });
    add({ type: "text", x: Math.round(w * 0.07), y: Math.round(h * 0.33), text: tagline, size: Math.round(h * 0.038), weight: 600, color: pal.ink });
    add({ type: "pill", x: Math.round(w * 0.07), y: Math.round(h * 0.72), w: Math.round(w * 0.30), h: Math.round(h * 0.085), r: 999, fill: pal.accent, text: pickCTA(intent, seed), tcolor: "#0b1020", tsize: Math.round(h * 0.032), tweight: 800 });
    add({ type: "photo", src: null, x: Math.round(w * 0.60), y: Math.round(h * 0.16), w: Math.round(w * 0.32), h: Math.round(h * 0.38), r: 40, stroke: "rgba(255,255,255,0.18)", fill: "rgba(255,255,255,0.06)" });
  }

  if (layout === "badgePromo") {
    const badgeW = Math.round(w * 0.22), badgeH = Math.round(h * 0.11);
    add({ type: "shape", x: Math.round(w * 0.08), y: Math.round(h * 0.12), w: Math.round(w * 0.84), h: Math.round(h * 0.56), r: 52, fill: "rgba(255,255,255,0.05)", stroke: "rgba(255,255,255,0.14)" });
    add({ type: "badge", x: Math.round(w * 0.73), y: Math.round(h * 0.09), w: badgeW, h: badgeH, r: 22, fill: pal.accent2, text: "LIMITED", tcolor: "#0b1020", tsize: Math.round(h * 0.03), tweight: 900 });
    add({ type: "text", x: Math.round(w * 0.12), y: Math.round(h * 0.22), text: brand, size: Math.round(h * 0.06), weight: 900, color: pal.ink });
    add({ type: "text", x: Math.round(w * 0.12), y: Math.round(h * 0.31), text: (intent?.type==="promo" ? "Flash Sale" : "Special Offer"), size: Math.round(h * 0.09), weight: 900, color: pal.ink, letter: -1 });
    add({ type: "pill", x: Math.round(w * 0.12), y: Math.round(h * 0.50), w: Math.round(w * 0.36), h: Math.round(h * 0.09), r: 999, fill: pal.accent, text: pickCTA(intent, seed), tcolor: "#0b1020", tsize: Math.round(h * 0.035), tweight: 900 });
  }

  if (layout === "minimalQuote") {
    add({ type: "shape", x: Math.round(w * 0.10), y: Math.round(h * 0.12), w: Math.round(w * 0.80), h: Math.round(h * 0.76), r: 46, fill: "rgba(255,255,255,0.04)", stroke: "rgba(255,255,255,0.12)" });
    add({ type: "text", x: Math.round(w * 0.16), y: Math.round(h * 0.22), text: "“" + (tagline || "Create something memorable.") + "”", size: Math.round(h * 0.06), weight: 800, color: pal.ink, italic: true });
    add({ type: "text", x: Math.round(w * 0.16), y: Math.round(h * 0.52), text: "— " + brand, size: Math.round(h * 0.035), weight: 700, color: pal.muted });
    add({ type: "pill", x: Math.round(w * 0.16), y: Math.round(h * 0.66), w: Math.round(w * 0.32), h: Math.round(h * 0.08), r: 999, fill: "rgba(255,255,255,0.08)", stroke: "rgba(255,255,255,0.16)", text: "Follow", tcolor: pal.ink, tsize: Math.round(h * 0.03), tweight: 800 });
  }

  if (layout === "featureGrid") {
    add({ type: "text", x: Math.round(w * 0.08), y: Math.round(h * 0.12), text: brand, size: Math.round(h * 0.055), weight: 900, color: pal.ink });
    add({ type: "text", x: Math.round(w * 0.08), y: Math.round(h * 0.22), text: "Built for your next post", size: Math.round(h * 0.035), weight: 700, color: pal.muted });
    const boxW = Math.round(w * 0.40), boxH = Math.round(h * 0.16);
    const startX = Math.round(w * 0.08), startY = Math.round(h * 0.32);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        const x = startX + c * (boxW + Math.round(w * 0.04));
        const y = startY + r * (boxH + Math.round(h * 0.03));
        add({ type: "shape", x, y, w: boxW, h: boxH, r: 28, fill: "rgba(255,255,255,0.04)", stroke: "rgba(255,255,255,0.12)" });
        add({ type: "dot", x: x + 22, y: y + 22, r: 8, fill: (c === 0 ? pal.accent : pal.accent2) });
        add({ type: "text", x: x + 44, y: y + 16, text: pick(["Clean layout", "Bold title", "Smart spacing", "Premium cards"], seed + r * 11 + c * 5), size: Math.round(h * 0.03), weight: 800, color: pal.ink });
        add({ type: "text", x: x + 44, y: y + 50, text: pick(["Readable", "Balanced", "Fast export", "Canva-style"], seed + r * 7 + c * 3), size: Math.round(h * 0.025), weight: 600, color: pal.muted });
      }
    }
  }

  if (layout === "bigNumber") {
    const num = String((seed % 9) + 1);
    add({ type: "text", x: Math.round(w * 0.10), y: Math.round(h * 0.16), text: num, size: Math.round(h * 0.26), weight: 900, color: "rgba(255,255,255,0.10)", letter: -6 });
    add({ type: "text", x: Math.round(w * 0.10), y: Math.round(h * 0.30), text: brand, size: Math.round(h * 0.06), weight: 900, color: pal.ink });
    add({ type: "text", x: Math.round(w * 0.10), y: Math.round(h * 0.40), text: tagline, size: Math.round(h * 0.04), weight: 700, color: pal.muted });
    add({ type: "pill", x: Math.round(w * 0.10), y: Math.round(h * 0.62), w: Math.round(w * 0.30), h: Math.round(h * 0.085), r: 999, fill: pal.accent, text: pickCTA(intent, seed), tcolor: "#0b1020", tsize: Math.round(h * 0.034), tweight: 900 });
  }

  if (layout === "photoCard") {
    add({ type: "photo", src: null, x: Math.round(w * 0.10), y: Math.round(h * 0.16), w: Math.round(w * 0.80), h: Math.round(h * 0.48), r: 40, stroke: "rgba(255,255,255,0.18)", fill: "rgba(255,255,255,0.06)" });
    add({ type: "shape", x: Math.round(w * 0.10), y: Math.round(h * 0.64), w: Math.round(w * 0.80), h: Math.round(h * 0.22), r: 36, fill: "rgba(255,255,255,0.05)", stroke: "rgba(255,255,255,0.14)" });
    add({ type: "text", x: Math.round(w * 0.14), y: Math.round(h * 0.68), text: brand, size: Math.round(h * 0.055), weight: 900, color: pal.ink });
    add({ type: "text", x: Math.round(w * 0.14), y: Math.round(h * 0.76), text: tagline, size: Math.round(h * 0.035), weight: 650, color: pal.muted });
    add({ type: "pill", x: Math.round(w * 0.14), y: Math.round(h * 0.84), w: Math.round(w * 0.30), h: Math.round(h * 0.075), r: 999, fill: pal.accent, text: pickCTA(intent, seed), tcolor: "#0b1020", tsize: Math.round(h * 0.03), tweight: 900 });
  }

  adStylePass(elements, spec, layout);
  return elements;
}

function makeTemplates({ prompt, category, style, count }) {
  const meta = CATEGORIES[category] || CATEGORIES["Instagram Post"];
  const baseSeed = hash(category + "|" + style + "|" + prompt);
  const out = [];
  for (let i = 0; i < count; i++) {
    const seed = (baseSeed + i * 1013) >>> 0;
    const intent = classifyIntent(prompt, category, style);
    const pal = paletteForStyle(style, seed, intent);
    const b = brandFromPrompt(prompt);
    const arch = archetypeWithIntent(seed, intent);
    const subtitle = (style || "Dark Premium") + " • " + arch.name;
    const elements = buildElements(arch.layout, { w: meta.w, h: meta.h, pal, brand: b.brand || "Nexora", tagline: b.tagline || "Premium templates, fast.", seed, intent });

    out.push({
      id: "tpl_" + seed.toString(16) + "_" + i,
      title: (category || "Template") + " #" + (i + 1),
      subtitle,
      category,
      style: style || "Dark Premium",
      ratio: meta.ratio,
      canvas: { w: meta.w, h: meta.h },
      palette: pal,
      elements
    });
  }
  return out;
}

function makeCopy(prompt, category){
  const p = String(prompt||"").trim();
  if(!p) return { headline: "New Collection", subhead: "Premium layout generated instantly.", cta: "Get Started" };
  const headline = p.length > 60 ? p.slice(0, 60) : p;
  const subhead = category ? `Designed for ${category}.` : "Designed for your next post.";
  const cta = /hiring|job|apply/i.test(p) ? "Apply Now" : (/sale|discount|%|offer/i.test(p) ? "Shop Now" : "Learn More");
  return { headline, subhead, cta };
}
