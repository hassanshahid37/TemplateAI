
// design.js — Phase F v1 (Canva-level visual layouts)
(function () {
  const Design = {};

  const palettes = [
    { bg: "#0b1220", card: "#111a2e", ink: "#ffffff", muted: "#aab0bd", accent: "#4f8cff" },
    { bg: "#071613", card: "#0f2a21", ink: "#eafff4", muted: "#7dd3a7", accent: "#22c55e" },
    { bg: "#1b0f17", card: "#2a1623", ink: "#fde7f3", muted: "#f9a8d4", accent: "#ec4899" },
    { bg: "#0f1a17", card: "#132a26", ink: "#ecfeff", muted: "#67e8f9", accent: "#06b6d4" },
    { bg: "#1f1409", card: "#2a1b0c", ink: "#fff7ed", muted: "#fdba74", accent: "#f59e0b" }
  ];

  const layouts = [heroCTA, splitPromo, minimalQuote, badgeOffer, editorial];

  function generateTemplates(opts = {}) {
    const count = Math.min(Math.max(opts.count || 24, 1), 200);
    const category = opts.category || "Instagram Post";
    const style = opts.style || "Dark Premium";
    const prompt = opts.prompt || "";
    const templates = [];

    for (let i = 0; i < count; i++) {
      const palette = palettes[i % palettes.length];
      const layout = layouts[i % layouts.length];
      templates.push(layout(i, palette, category, style, prompt));
    }
    return templates;
  }

  function baseTemplate(title, palette, category, style) {
    return { title, subtitle: `${style} • Canva-level`, category, palette, elements: [] };
  }

  function heroCTA(i, p, c, s, prompt) {
    const t = baseTemplate(prompt || "Grow Your Brand", p, c, s);
    t.elements = [
      { type: "background", fill: p.bg },
      { type: "heading", text: prompt || "Grow Your Brand", x: 70, y: 140, fontSize: 60, color: p.ink },
      { type: "text", text: "Premium design built to convert", x: 70, y: 240, fontSize: 28, color: p.muted },
      { type: "button", text: "Get Started", x: 70, y: 320, background: p.accent, color: "#fff" }
    ];
    return t;
  }

  function splitPromo(i, p, c, s, prompt) {
    const t = baseTemplate("New Collection", p, c, s);
    t.elements = [
      { type: "background", fill: p.bg },
      { type: "heading", text: "New Collection", x: 60, y: 160, fontSize: 54, color: p.ink },
      { type: "text", text: prompt || "Modern layouts for brands", x: 60, y: 240, fontSize: 26, color: p.muted },
      { type: "shape", x: 520, y: 120, width: 420, height: 420, background: p.card }
    ];
    return t;
  }

  function minimalQuote(i, p, c, s, prompt) {
    const t = baseTemplate("Minimal Quote", p, c, s);
    t.elements = [
      { type: "background", fill: p.bg },
      { type: "heading", text: prompt || "Design is intelligence made visible.", x: 120, y: 300, fontSize: 52, color: p.ink }
    ];
    return t;
  }

  function badgeOffer(i, p, c, s, prompt) {
    const t = baseTemplate("Limited Offer", p, c, s);
    t.elements = [
      { type: "background", fill: p.bg },
      { type: "badge", text: "LIMITED", x: 80, y: 120, background: p.accent, color: "#fff" },
      { type: "heading", text: "Flash Sale", x: 80, y: 200, fontSize: 56, color: p.ink },
      { type: "button", text: "Save 30%", x: 80, y: 300, background: p.accent, color: "#fff" }
    ];
    return t;
  }

  function editorial(i, p, c, s, prompt) {
    const t = baseTemplate("Editorial", p, c, s);
    t.elements = [
      { type: "background", fill: p.bg },
      { type: "heading", text: "Celebrate in Style", x: 200, y: 200, fontSize: 58, color: p.ink, align: "center" },
      { type: "divider", x: 200, y: 280 },
      { type: "text", text: prompt || "A premium announcement layout", x: 200, y: 320, fontSize: 26, color: p.muted, align: "center" }
    ];
    return t;
  }

  Design.generateTemplates = generateTemplates;
  window.NexoraDesign = Design;
})();
