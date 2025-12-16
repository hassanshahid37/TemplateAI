// design.js — Canva-level template generator (Stable UI Compatible)
// Generates high-quality, varied template data (no UI/rendering here).
// Output schema matches Nexora generator/editor expectations.

const CANVAS = { w: 980, h: 620 };

const PALETTES = [
  { name:"Blue Violet", bg:"linear-gradient(135deg,#0b5fff,#7b5cff)", primary:"#0b5fff", accent:"#7b5cff", ink:"#ffffff", soft:"rgba(255,255,255,.10)" },
  { name:"Midnight Cyan", bg:"linear-gradient(135deg,#0b1020,#00d1ff)", primary:"#00d1ff", accent:"#0b5fff", ink:"#ffffff", soft:"rgba(255,255,255,.10)" },
  { name:"Sunset Premium", bg:"linear-gradient(135deg,#ff4d6d,#7b5cff)", primary:"#ff4d6d", accent:"#7b5cff", ink:"#ffffff", soft:"rgba(255,255,255,.10)" },
  { name:"Emerald Noir", bg:"linear-gradient(135deg,#07130f,#00c389)", primary:"#00c389", accent:"#0b5fff", ink:"#ffffff", soft:"rgba(255,255,255,.10)" },
  { name:"Gold Luxe", bg:"linear-gradient(135deg,#0b1020,#ffcc66)", primary:"#ffcc66", accent:"#7b5cff", ink:"#ffffff", soft:"rgba(255,255,255,.10)" },
  { name:"Clean Light", bg:"linear-gradient(135deg,#ffffff,#e9efff)", primary:"#0b5fff", accent:"#7b5cff", ink:"#0b1020", soft:"rgba(10,20,60,.08)" },
];

const HEADLINES = [
  "Grow Your Brand",
  "New Collection Drop",
  "Limited Time Offer",
  "Upgrade Your Look",
  "Launch Day Special",
  "Premium Minimal Design",
  "Midnight Sale",
  "Bold Statement",
  "Modern Essentials",
  "Designed For Conversion"
];

const SUBLINES = [
  "Modern premium aesthetic • built for conversions",
  "Clean typography • bold hierarchy • strong spacing",
  "High-impact layout • ready for social",
  "Luxury vibes • sharp contrast • crisp grid",
  "Designed to look like premium Canva packs",
  "Elegant, minimal, and highly usable",
  "Make it scroll‑stopping in seconds",
  "Smart spacing • clean layout • premium feel"
];

const CTAS = ["Get Started", "Shop Now", "Learn More", "Join Today", "Explore", "Download", "Book Now"];

function uid(){
  return (globalThis.crypto?.randomUUID?.() || (Math.random().toString(16).slice(2) + Date.now().toString(16)));
}

function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }

function pick(arr, i){
  return arr[(i % arr.length + arr.length) % arr.length];
}

function extractKeywords(prompt=""){
  const s = String(prompt||"").toLowerCase();
  const words = s.replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(Boolean);
  const stop = new Set(["the","and","for","with","your","you","a","an","to","of","in","on","is","are","this","that","it","we","our"]);
  const uniq = [];
  for(const w of words){
    if(w.length < 3) continue;
    if(stop.has(w)) continue;
    if(!uniq.includes(w)) uniq.push(w);
    if(uniq.length >= 4) break;
  }
  return uniq;
}

function composeText(i, prompt=""){
  const kws = extractKeywords(prompt);
  const headline = kws.length ? (kws[0].slice(0,1).toUpperCase() + kws[0].slice(1) + " " + pick(["Studio","Sale","Campaign","Launch","Drop"], i)) : pick(HEADLINES, i);
  const sub = kws.length ? `Featuring ${kws.join(" • ")} • premium layout` : pick(SUBLINES, i);
  const cta = pick(CTAS, i);
  return { headline, sub, cta };
}

// --- Archetypes (Canva-like) ---
function archetypeHeroCTA(p, i, prompt=""){
  const { headline, sub, cta } = composeText(i, prompt);
  return [
    { type:"background", x:0,y:0,w:CANVAS.w,h:CANVAS.h, title:"BG", sub:"", fill:p.bg },
    { type:"card", x:60,y:70,w:860,h:480, title:"CARD", sub:"", background:p.soft, radius:24 },
    { type:"badge", x:90,y:100,w:220,h:54, title:"LIMITED", sub:"", background:"rgba(255,255,255,.14)", radius:999, color:p.ink, fontSize:16, fontWeight:800 },
    { type:"heading", x:90,y:168,w:740,h:140, title:headline, sub:"", color:p.ink, fontSize:64, fontWeight:800, align:"left" },
    { type:"text", x:90,y:300,w:610,h:80, title:sub, sub:"", color:"rgba(255,255,255,.86)", fontSize:18, fontWeight:500, align:"left" },
    { type:"image", x:650,y:250,w:250,h:220, title:"IMAGE", sub:"Photo / product", background:"linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.06))", radius:22 },
    { type:"cta", x:90,y:404,w:260,h:64, title:cta, sub:"", background:`linear-gradient(135deg, ${p.primary}, ${p.accent})`, radius:18, color:"#ffffff", fontSize:16, fontWeight:800 },
  ];
}

function archetypeSplit(p, i, prompt=""){
  const { headline, sub, cta } = composeText(i+2, prompt);
  return [
    { type:"background", x:0,y:0,w:CANVAS.w,h:CANVAS.h, title:"BG", sub:"", fill:p.bg },
    { type:"shape", x:60,y:70,w:420,h:480, title:"PANEL", sub:"", background:"rgba(0,0,0,.14)", radius:24 },
    { type:"heading", x:90,y:110,w:360,h:130, title:headline, sub:"", color:p.ink, fontSize:58, fontWeight:800, align:"left" },
    { type:"text", x:90,y:250,w:360,h:120, title:sub, sub:"", color:"rgba(255,255,255,.84)", fontSize:16, fontWeight:500, align:"left" },
    { type:"cta", x:90,y:410,w:260,h:60, title:cta, sub:"", background:`linear-gradient(135deg, ${p.primary}, ${p.accent})`, radius:16, color:"#ffffff", fontSize:15, fontWeight:800 },
    { type:"image", x:510,y:90,w:410,h:440, title:"IMAGE", sub:"Model / product", background:"linear-gradient(135deg, rgba(255,255,255,.20), rgba(255,255,255,.05))", radius:28 },
  ];
}

function archetypeEditorial(p, i, prompt=""){
  const { headline, sub } = composeText(i+4, prompt);
  return [
    { type:"background", x:0,y:0,w:CANVAS.w,h:CANVAS.h, title:"BG", sub:"", fill:p.bg },
    { type:"card", x:70,y:70,w:840,h:480, title:"CARD", sub:"", background:"rgba(255,255,255,.08)", radius:26 },
    { type:"heading", x:110,y:110,w:520,h:160, title:headline, sub:"", color:p.ink, fontSize:70, fontWeight:900, align:"left" },
    { type:"shape", x:110,y:285,w:120,h:10, title:"RULE", sub:"", background:"rgba(255,255,255,.55)", radius:999 },
    { type:"text", x:110,y:310,w:520,h:120, title:sub, sub:"", color:"rgba(255,255,255,.82)", fontSize:17, fontWeight:500, align:"left" },
    { type:"image", x:650,y:140,w:210,h:330, title:"IMAGE", sub:"Editorial photo", background:"linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.05))", radius:24 },
    { type:"badge", x:650,y:490,w:210,h:44, title:"NEW", sub:"", background:"rgba(0,0,0,.18)", radius:999, color:p.ink, fontSize:14, fontWeight:800 },
  ];
}

function archetypePoster(p, i, prompt=""){
  const { headline, sub, cta } = composeText(i+6, prompt);
  return [
    { type:"background", x:0,y:0,w:CANVAS.w,h:CANVAS.h, title:"BG", sub:"", fill:p.bg },
    { type:"shape", x:90,y:90,w:800,h:440, title:"GLOW", sub:"", background:"radial-gradient(420px 260px at 30% 35%, rgba(255,255,255,.18), transparent 60%)", radius:32 },
    { type:"badge", x:120,y:120,w:240,h:52, title:"SPECIAL", sub:"", background:"rgba(255,255,255,.14)", radius:999, color:p.ink, fontSize:15, fontWeight:900 },
    { type:"heading", x:120,y:188,w:760,h:170, title:headline, sub:"", color:p.ink, fontSize:74, fontWeight:900, align:"left" },
    { type:"text", x:120,y:350,w:540,h:80, title:sub, sub:"", color:"rgba(255,255,255,.84)", fontSize:16, fontWeight:500, align:"left" },
    { type:"cta", x:120,y:450,w:260,h:62, title:cta, sub:"", background:`linear-gradient(135deg, ${p.primary}, ${p.accent})`, radius:18, color:"#ffffff", fontSize:16, fontWeight:900 },
    { type:"image", x:670,y:360,w:220,h:170, title:"IMAGE", sub:"Product", background:"linear-gradient(135deg, rgba(255,255,255,.20), rgba(255,255,255,.06))", radius:22 },
  ];
}

const ARCHETYPES = [archetypeHeroCTA, archetypeSplit, archetypeEditorial, archetypePoster];

function buildTemplate(i, { category="Instagram Post", style="Dark Premium", prompt="", notes="" } = {}){
  const p = pick(PALETTES, i);
  const make = pick(ARCHETYPES, i);
  const elements = make(p, i, prompt).map(e => ({ id: uid(), ...e }));

  // Ensure elements are inside canvas
  for(const e of elements){
    e.x = clamp(Number(e.x ?? 0), 0, CANVAS.w);
    e.y = clamp(Number(e.y ?? 0), 0, CANVAS.h);
    e.w = clamp(Number(e.w ?? e.width ?? 120), 2, CANVAS.w);
    e.h = clamp(Number(e.h ?? e.height ?? 40), 2, CANVAS.h);
  }

  const title = `${category} #${i+1}`;
  const description = `${style} • ${p.name} • ${make.name.replace("archetype","").trim() || "Premium"}`;

  return {
    id: `dj_${Date.now()}_${i+1}`,
    title,
    description,
    category,
    style,
    bg: p.bg,
    canvas: { w: CANVAS.w, h: CANVAS.h },
    elements
  };
}

// Backwards-compatible API:
export function generateTemplates(count = 24, opts = {}) {
  const safeCount = clamp(parseInt(count,10) || 24, 1, 200);
  const out = [];
  for(let i=0;i<safeCount;i++){
    out.push(buildTemplate(i, opts));
  }
  return out;
}

// Optional richer API
export function generateTemplateSet({ count=24, category="Instagram Post", style="Dark Premium", prompt="", notes="" } = {}) {
  return generateTemplates(count, { category, style, prompt, notes });
}
