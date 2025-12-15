// Phase 2 – Dark Premium + Modern Neon (UI SAFE)

function applyPhase2Style(card, index) {
  const isNeon = index % 2 === 1;

  card.style.borderRadius = "18px";
  card.style.padding = "18px";
  card.style.position = "relative";
  card.style.overflow = "hidden";

  if (isNeon) {
    // Modern Neon
    card.style.background =
      "linear-gradient(135deg, #050712, #0a0020)";
    card.style.boxShadow =
      "0 0 0 1px rgba(0,240,255,0.25), 0 20px 40px rgba(0,240,255,0.15)";
  } else {
    // Dark Premium
    card.style.background =
      "linear-gradient(135deg, #050712, #0b1025)";
    card.style.boxShadow =
      "0 0 0 1px rgba(255,255,255,0.08), 0 18px 45px rgba(0,0,0,0.6)";
  }

  const badge = document.createElement("div");
  badge.textContent = isNeon ? "Neon" : "Dark Premium";
  badge.style.position = "absolute";
  badge.style.top = "12px";
  badge.style.right = "12px";
  badge.style.fontSize = "11px";
  badge.style.padding = "4px 10px";
  badge.style.borderRadius = "999px";
  badge.style.background = isNeon ? "#00f0ff" : "#c9a24d";
  badge.style.color = "#000";
  badge.style.fontWeight = "600";

  card.appendChild(badge);
}
