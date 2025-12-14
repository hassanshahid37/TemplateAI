// design.js
// Handles layout & style variations safely

export const layouts = [
  {
    name: "Compact",
    apply: (tile) => {
      tile.style.padding = "10px";
      tile.style.minHeight = "80px";
    }
  },
  {
    name: "Spacious",
    apply: (tile) => {
      tile.style.padding = "22px";
      tile.style.minHeight = "120px";
    }
  },
  {
    name: "Centered",
    apply: (tile) => {
      tile.style.textAlign = "center";
    }
  }
];

export const styles = [
  {
    name: "Dark Premium",
    apply: (tile) => {
      tile.style.background = "rgba(15,18,32,.55)";
      tile.style.borderColor = "rgba(255,255,255,.10)";
    }
  },
  {
    name: "Neon",
    apply: (tile) => {
      tile.style.background = "linear-gradient(135deg,#0b5fff,#8847ff)";
      tile.style.borderColor = "rgba(255,255,255,.25)";
    }
  },
  {
    name: "Minimal Light",
    apply: (tile) => {
      tile.style.background = "rgba(255,255,255,.85)";
      tile.style.borderColor = "rgba(10,20,60,.12)";
    }
  }
];
