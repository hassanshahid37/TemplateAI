
/* Nexora Phase 2.1 – Visual Engine (Dark Premium + Modern Neon)
   UI SAFE – logic only
*/

export const STYLE_PACKS = {
  darkPremium: {
    name: "Dark Premium",
    bg: "linear-gradient(135deg,#050712,#0b1025)",
    card: "rgba(255,255,255,0.06)",
    accent: "#c9a24d",
    text: "#f6f7fb",
    muted: "#aab0bd"
  },
  neon: {
    name: "Modern Neon",
    bg: "linear-gradient(135deg,#050712,#090019)",
    card: "rgba(255,255,255,0.05)",
    accent: "#00f0ff",
    text: "#ffffff",
    muted: "#b9b9ff"
  }
};

export function applyVisual(template, cardEl){
  const style = template.stylePack === "neon"
    ? STYLE_PACKS.neon
    : STYLE_PACKS.darkPremium;

  cardEl.style.background = style.card;
  cardEl.style.border = "1px solid rgba(255,255,255,0.08)";
  cardEl.style.boxShadow = `0 20px 40px ${style.accent}22`;
  cardEl.style.position = "relative";
  cardEl.style.overflow = "hidden";

  const badge = document.createElement("div");
  badge.textContent = style.name;
  badge.style.position = "absolute";
  badge.style.top = "10px";
  badge.style.right = "10px";
  badge.style.fontSize = "11px";
  badge.style.fontWeight = "600";
  badge.style.padding = "4px 8px";
  badge.style.borderRadius = "20px";
  badge.style.background = style.accent;
  badge.style.color = "#000";
  cardEl.appendChild(badge);
}
