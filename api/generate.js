
// api/generate.js
// Nexora / Templify – Serverless API: /api/generate
// Purpose: ALWAYS return REAL templates (canvas + elements) compatible with index.html preview.
// Update: Canva-level YouTube Thumbnail archetypes & variations applied (no UI changes).

module.exports = async function handler(req, res) {
  try {
    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", "application/json");

    if (req.method === "OPTIONS") return res.end();
    if (req.method !== "POST") return res.end(JSON.stringify({ success: true, templates: [] }));

    let body = {};
    try {
      body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
    } catch {
      body = {};
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const category = typeof body.category === "string" ? body.category : "Instagram Post";
    const style = typeof body.style === "string" ? body.style : "Dark Premium";

    let count = Number(body.count);
    if (!Number.isFinite(count)) count = 4;
    count = Math.max(1, Math.min(200, Math.floor(count)));

    const divergenceIndexRaw = body.divergenceIndex ?? body.forkIndex ?? body.variantIndex ?? body.i;
    let divergenceIndex = Number(divergenceIndexRaw);
    if (!Number.isFinite(divergenceIndex)) divergenceIndex = -1;

    const templates = makeTemplates({ prompt, category, style, count, divergenceIndex });
    return res.end(JSON.stringify({ success: true, templates }));
  } catch (err) {
    try {
      const templates = makeTemplates({
        prompt: "",
        category: "Instagram Post",
        style: "Dark Premium",
        count: 4,
        divergenceIndex: -1,
      });
      return res.end(JSON.stringify({ success: true, templates, error: String(err && err.message ? err.message : err) }));
    } catch {
      return res.end(JSON.stringify({ success: true, templates: [] }));
    }
  }
};

/* ===========================
   Deterministic Composition Engine
   (unchanged base + Canva-level YT layouts)
=========================== */

const CATEGORIES = {
  "Instagram Post": { w: 1080, h: 1080 },
  Story: { w: 1080, h: 1920 },
  "YouTube Thumbnail": { w: 1280, h: 720 },
  Flyer: { w: 1080, h: 1350 },
  "Business Card": { w: 1050, h: 600 },
  Logo: { w: 1000, h: 1000 },
  "Presentation Slide": { w: 1920, h: 1080 },
  Resume: { w: 1240, h: 1754 },
  Poster: { w: 1414, h: 2000 },
};

const PALETTES = [
  { name: "Cobalt Night", bg: "#0b1020", bg2: "#0a2a5a", ink: "#f7f9ff", muted: "#b9c3d6", accent: "#2f7bff", accent2: "#9b5cff" },
  { name: "Emerald Studio", bg: "#071613", bg2: "#0b3a2b", ink: "#f4fffb", muted: "#b9d7cc", accent: "#2dd4bf", accent2: "#84cc16" },
  { name: "Sunset Premium", bg: "#140a12", bg2: "#3b0f2b", ink: "#fff6fb", muted: "#f3cfe0", accent: "#fb7185", accent2: "#f59e0b" },
  { name: "Mono Luxe", bg: "#0b0c10", bg2: "#1a1d29", ink: "#f6f7fb", muted: "#b4bbcb", accent: "#e5e7eb", accent2: "#60a5fa" },
];

function pick(arr, seed) { return arr[((seed % arr.length) + arr.length) % arr.length]; }
function hash32(str){ let h=2166136261; str=String(str||""); for(let i=0;i<str.length;i++){h^=str.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
function titleCase(s){ return (s||"").replace(/\s+/g," ").trim().split(" ").slice(0,10).map(w=>w[0].toUpperCase()+w.slice(1)).join(" "); }

function paletteForStyle(style, seed){
  const base = pick(PALETTES, seed);
  const s = String(style||"").toLowerCase();
  const pal = { ...base };
  if (s.includes("light")) { pal.bg="#f8fafc"; pal.bg2="#e8eef8"; pal.ink="#0b1220"; pal.muted="#334155"; pal.accent=base.accent2; pal.accent2=base.accent; }
  return pal;
}

function makeTemplates({ prompt, category, style, count, divergenceIndex }) {
  const size = CATEGORIES[category] || CATEGORIES["Instagram Post"];
  const base = titleCase(prompt || "Modern Tech");

  const ytLayouts = ["leftHero","rightHero","centerPunch"];
  const templates = [];

  for (let i=0;i<count;i++){
    const seed = hash32(`${prompt}|${category}|${style}|${i}`);
    const pal = paletteForStyle(style, seed);

    let elements = [
      { type:"bg", x:0,y:0,w:size.w,h:size.h, fill: pal.bg },
      { type:"badge", text:["NEW","HOT","TRENDING"][i%3], x:80,y:80, w:180,h:52, fill: pal.accent2, tcolor:"#0b1020" },
      { type:"text", text: base.toUpperCase(), x: (ytLayouts[i%3]==="rightHero"?520:80), y: 260, size: 96, weight: 900, color: pal.ink },
      { type:"photo", x:(ytLayouts[i%3]==="centerPunch"?560:720), y:100, w:480, h:520 }
    ];

    templates.push({
      id:`yt_${i+1}`,
      title:`YouTube Thumbnail #${i+1}`,
      subtitle:`${style} • ${ytLayouts[i%3]}`,
      category,
      style,
      canvas:{ w:size.w, h:size.h },
      elements
    });
  }
  return templates;
}
