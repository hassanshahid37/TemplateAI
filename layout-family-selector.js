
/**
 * layout-family-selector.js — Nexora P7
 * Decides WHICH layout family to use.
 * Deterministic, no UI, no mutation.
 */
(function(root){
  function selectLayoutFamily({ category, prompt }){
    const p = String(prompt||"").toLowerCase();
    if(p.includes("photo") || p.includes("image")) return "image-led";
    if(p.includes("quote") || p.includes("text")) return "text-first";
    return "generic";
  }

  if(typeof module !== "undefined" && module.exports){
    module.exports = { selectLayoutFamily };
  } else {
    root.selectLayoutFamily = selectLayoutFamily;
  }
})(typeof globalThis!=="undefined"?globalThis:window);
