
// design.js — Phase F v2 (Strong hierarchy, Canva-grade)
// SAFE: drop-in replacement. No UI/API changes.

(function () {
  const Design = {};

  // ---------- UTIL ----------
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const hash = (s) => {
    s = String(s || "");
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  };
  const pick = (arr, seed) => arr[seed % arr.length];

  // ---------- PALETTES (premium contrast) ----------
  const PALETTES = [
    { bg:"#0b1220", card:"#0f1b36", ink:"#ffffff", muted:"#b7c0d4", accent:"#4f8cff", glow:"rgba(79,140,255,.25)" },
    { bg:"#071613", card:"#0e2b23", ink:"#eafff4", muted:"#8fe0bf", accent:"#22c55e", glow:"rgba(34,197,94,.25)" },
    { bg:"#1b0f17", card:"#2a1623", ink:"#fde7f3", muted:"#f3a7cf", accent:"#ec4899", glow:"rgba(236,72,153,.28)" },
    { bg:"#0f1a17", card:"#132a26", ink:"#ecfeff", muted:"#8de6f0", accent:"#06b6d4", glow:"rgba(6,182,212,.28)" },
    { bg:"#1f1409", card:"#2a1b0c", ink:"#fff7ed", muted:"#fdc48b", accent:"#f59e0b", glow:"rgba(245,158,11,.28)" }
  ];

  // ---------- LAYOUTS (intent-aware) ----------
  const LAYOUTS = [heroAnnouncement, productSplit, saleBadge, minimalQuote, editorialCard];

  function generateTemplates(opts = {}) {
    const count = clamp(parseInt(opts.count || 24, 10), 1, 200);
    const category = opts.category || "Instagram Post";
    const style = opts.style || "Dark Premium";
    const prompt = String(opts.prompt || "").trim();

    const seed0 = hash(prompt + category + style);
    const out = [];

    for (let i = 0; i < count; i++) {
      const seed = seed0 + i * 131;
      const p = pick(PALETTES, seed);
      const layout = pick(LAYOUTS, seed + 7);
      out.push(layout(i, p, category, style, prompt, seed));
    }
    return out;
  }

  // ---------- BASE ----------
  function base(title, p, category, style) {
    return {
      title,
      subtitle: `${style} • Premium`,
      category,
      palette: p,
      elements: []
    };
  }

  // ---------- ELEMENT HELPERS ----------
  const bg = (p) => ({ type:"background", fill:p.bg });
  const card = (x,y,w,h,p) => ({ type:"shape", x,y,width:w,height:h, background:p.card, radius:28, shadow:`0 30px 80px ${p.glow}` });
  const h1 = (t,x,y,p,align="left") => ({ type:"heading", text:t, x,y, fontSize:68, fontWeight:800, color:p.ink, align });
  const h2 = (t,x,y,p,align="left") => ({ type:"heading", text:t, x,y, fontSize:42, fontWeight:700, color:p.ink, align });
  const body = (t,x,y,p,align="left") => ({ type:"text", text:t, x,y, fontSize:24, color:p.muted, align });
  const cta = (t,x,y,p) => ({ type:"button", text:t, x,y, background:p.accent, color:"#fff", radius:999 });
  const badge = (t,x,y,p) => ({ type:"badge", text:t, x,y, background:p.accent, color:"#fff" });
  const divider = (x,y,w=360,p) => ({ type:"divider", x,y, width:w, color:"rgba(255,255,255,.18)" });

  // ---------- LAYOUTS ----------
  function heroAnnouncement(i,p,c,s,prompt,seed){
    const headline = prompt || "Introducing a Smarter SaaS";
    const t = base(headline, p, c, s);
    t.elements = [
      bg(p),
      card(70,120,940,520,p),
      h1(headline,140,200,p),
      body("Launch announcement • clear value • strong CTA",140,290,p),
      cta("Get Started",140,360,p)
    ];
    return t;
  }

  function productSplit(i,p,c,s,prompt,seed){
    const t = base("New Feature Release", p, c, s);
    t.elements = [
      bg(p),
      card(60,140,480,500,p),
      h2("New Feature",110,200,p),
      body(prompt || "Designed to be fast, clean, and scalable.",110,260,p),
      cta("Explore",110,330,p),
      card(600,160,360,460,p)
    ];
    return t;
  }

  function saleBadge(i,p,c,s,prompt,seed){
    const t = base("Limited Time Offer", p, c, s);
    t.elements = [
      bg(p),
      card(120,140,840,500,p),
      badge("LIMITED",170,190,p),
      h1("Flash Sale",170,240,p),
      body(prompt || "Save big on premium plans today.",170,330,p),
      cta("Save 30%",170,400,p)
    ];
    return t;
  }

  function minimalQuote(i,p,c,s,prompt,seed){
    const quote = prompt || "Design is intelligence made visible.";
    const t = base("Minimal Quote", p, c, s);
    t.elements = [
      bg(p),
      h1(quote,160,360,p)
    ];
    return t;
  }

  function editorialCard(i,p,c,s,prompt,seed){
    const t = base("Editorial", p, c, s);
    t.elements = [
      bg(p),
      card(140,160,800,460,p),
      h2("Company Update",200,230,p,"center"),
      divider(360,290,360,p),
      body(prompt || "A clean editorial layout for announcements.",200,330,p,"center")
    ];
    return t;
  }

  Design.generateTemplates = generateTemplates;
  window.NexoraDesign = Design;
})();

