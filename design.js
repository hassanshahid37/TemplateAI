// Nexora Phase 2.1 – Dark Premium + Modern Neon (UI SAFE, NO MODULES, NO IMPORTS)
window.applyPhase2Style = function(tile, index){
  const isNeon = (index % 2) === 1;

  // Visual enhancement only
  tile.style.borderRadius = tile.style.borderRadius || "18px";
  tile.style.position = "relative";
  tile.style.overflow = "hidden";

  if(isNeon){
    tile.style.background = "linear-gradient(135deg,#050712,#0a0020)";
    tile.style.boxShadow = "0 0 0 1px rgba(0,240,255,.22), 0 18px 44px rgba(0,240,255,.14)";
  } else {
    tile.style.background = "linear-gradient(135deg,#050712,#0b1025)";
    tile.style.boxShadow = "0 0 0 1px rgba(255,255,255,.08), 0 18px 44px rgba(0,0,0,.55)";
  }

  if(tile.querySelector(".p2-badge")) return;

  const badge = document.createElement("div");
  badge.className = "p2-badge";
  badge.textContent = isNeon ? "Modern Neon" : "Dark Premium";
  badge.style.position = "absolute";
  badge.style.top = "10px";
  badge.style.right = "10px";
  badge.style.fontSize = "11px";
  badge.style.padding = "4px 10px";
  badge.style.borderRadius = "999px";
  badge.style.background = isNeon ? "#00f0ff" : "#c9a24d";
  badge.style.color = "#000";
  badge.style.fontWeight = "700";
  badge.style.letterSpacing = ".2px";

  tile.appendChild(badge);
};
