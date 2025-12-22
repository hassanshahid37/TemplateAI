
// invisible-editor.js — Phase AD-IE1
// Invisible Editor = Brain layer (fast, deterministic)
// NO UI, NO rendering, NO visuals

(function () {
  if (window.__NEXORA_INVISIBLE_EDITOR_V2__) return;
  window.__NEXORA_INVISIBLE_EDITOR_V2__ = true;

  // Global cache for decided intelligence
  window.NEXORA_INTEL = {
    intent: null,
    archetype: null,
    palette: null,
    copy: null,
    seed: null
  };

  // Simple intent classifier (fast)
  function classifyIntent(prompt = "") {
    const p = prompt.toLowerCase();
    if (/(sale|discount|offer|%|deal|limited)/.test(p)) return "promo";
    if (/(hiring|job|career|apply|vacancy)/.test(p)) return "hiring";
    if (/(event|launch|webinar|meetup|conference)/.test(p)) return "announcement";
    if (p.split(" ").length <= 5) return "quote";
    return "generic";
  }

  function decideArchetype(intent) {
    const map = {
      promo: "badgePromo",
      hiring: "featureGrid",
      announcement: "eventFlyer",
      quote: "minimalQuote",
      generic: "splitHero"
    };
    return map[intent] || "splitHero";
  }

  function decidePalette(style = "") {
    if (/neon/i.test(style)) return "neon";
    if (/corporate/i.test(style)) return "corporate";
    if (/light/i.test(style)) return "light";
    return "dark";
  }

  function buildCopy(prompt = "") {
    const words = prompt.split(" ").filter(Boolean);
    return {
      headline: words.slice(0, 6).join(" ") || "New Design",
      subhead: words.slice(6, 14).join(" ") || "Designed to impress",
      cta: "Learn More"
    };
  }

  // Main hook — called once per Generate
  window.NEXORA_RUN_INTELLIGENCE = function ({ prompt = "", style = "" } = {}) {
    const seed = Math.abs(
      Array.from(prompt).reduce((a, c) => a + c.charCodeAt(0), 0)
    );

    const intent = classifyIntent(prompt);
    const archetype = decideArchetype(intent);
    const palette = decidePalette(style);
    const copy = buildCopy(prompt);

    window.NEXORA_INTEL = {
      intent,
      archetype,
      palette,
      copy,
      seed
    };

    console.log("[Nexora IE] Intelligence resolved:", window.NEXORA_INTEL);
    return window.NEXORA_INTEL;
  };

})();
