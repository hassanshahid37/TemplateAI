/**
 * preview-renderer.js — Nexora Preview Renderer v1
 * Spine-correct, client-only, deterministic renderer
 * Input: { contract, content }
 * Output: DOM only
 */

(function () {
  if (window.NexoraPreview) return;

  function noop() {}

  function validate(contract) {
    try {
      return !!(window.NexoraSpine &&
        typeof window.NexoraSpine.validateContract === "function" &&
        window.NexoraSpine.validateContract(contract));
    } catch {
      return false;
    }
  }

  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function applyStyles(node, style) {
    if (!style) return;
    if (style.fontSize) node.style.fontSize = style.fontSize + "px";
    if (style.fontWeight) node.style.fontWeight = style.fontWeight;
    if (style.casing === "uppercase") node.style.textTransform = "uppercase";
    if (style.casing === "capitalize") node.style.textTransform = "capitalize";
    if (style.stroke) {
      node.style.webkitTextStroke = style.stroke.width + "px " + style.stroke.color;
    }
  }

  function renderLayer(layer, content, meta) {
    const role = layer.role;
    const wrap = el("div", "nr-layer nr-" + role);

    wrap.style.position = "relative";
    wrap.style.margin = "12px";

    const applyStyle = window.applyStyle || noop;
    const style = applyStyle({
      category: meta.category,
      archetype: meta.style,
      elementType: role
    });

    if (role === "background") {
      wrap.style.position = "absolute";
      wrap.style.inset = "0";
      wrap.style.background = meta.palette?.bg || "#111";
      return wrap;
    }

    if (role === "image") {
      const img = el("div", "nr-image");
      img.style.width = "100%";
      img.style.height = "220px";
      img.style.background = "#222";
      img.style.borderRadius = "16px";
      wrap.appendChild(img);
      return wrap;
    }

    if (role === "headline") {
      const h = el("div", "nr-headline");
      h.textContent = content.headline || "";
      applyStyles(h, style);
      wrap.appendChild(h);
      return wrap;
    }

    if (role === "subhead") {
      const p = el("div", "nr-subhead");
      p.textContent = content.subhead || "";
      applyStyles(p, style);
      wrap.appendChild(p);
      return wrap;
    }

    if (role === "cta") {
      const b = el("button", "nr-cta");
      b.textContent = content.cta || "CTA";
      applyStyles(b, style);
      wrap.appendChild(b);
      return wrap;
    }

    if (role === "badge") {
      const s = el("span", "nr-badge");
      s.textContent = content.badge || "";
      applyStyles(s, style);
      wrap.appendChild(s);
      return wrap;
    }

    return wrap;
  }

  window.NexoraPreview = {
    render({ contract, content }) {
      try {
        if (!validate(contract)) return;

        const root = document.getElementById("canvas");
        if (!root) return;

        clear(root);

        const { width, height } = contract.canvas || {};
        if (width && height) {
          root.style.aspectRatio = width + " / " + height;
        }

        const meta = {
          category: contract.category,
          style: contract.style,
          palette: contract.palette || {}
        };

        contract.layers.forEach(layer => {
          const node = renderLayer(layer, content || {}, meta);
          if (node) root.appendChild(node);
        });
      } catch {
        // silent fail
      }
    }
  };
})();
