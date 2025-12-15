// Phase 2 – Dark Premium + Modern Neon (SAFE VISUAL ONLY)
function applyPhase2Style(tile, index){
  const isNeon = index % 2 === 1;

  tile.style.borderRadius = "18px";
  tile.style.position = "relative";
  tile.style.overflow = "hidden";

  if(isNeon){
    tile.style.background = "linear-gradient(135deg,#050712,#0a0020)";
    tile.style.boxShadow = "0 0 0 1px rgba(0,240,255,.25), 0 18px 40px rgba(0,240,255,.15)";
  } else {
    tile.style.background = "linear-gradient(135deg,#050712,#0b1025)";
    tile.style.boxShadow = "0 0 0 1px rgba(255,255,255,.08), 0 18px 40px rgba(0,0,0,.55)";
  }

  if(tile.querySelector(".p2-badge")) return;

  const badge = document.createElement("div");
  badge.className = "p2-badge";
  badge.textContent = isNeon ? "Neon" : "Dark Premium";
  badge.style.position = "absolute";
  badge.style.top = "10px";
  badge.style.right = "10px";
  badge.style.fontSize = "11px";
  badge.style.padding = "4px 10px";
  badge.style.borderRadius = "999px";
  badge.style.background = isNeon ? "#00f0ff" : "#c9a24d";
  badge.style.color = "#000";
  badge.style.fontWeight = "600";

  tile.appendChild(badge);
}
