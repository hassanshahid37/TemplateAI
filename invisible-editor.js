// invisible-editor.js — Phase I → J bridge (safe, non-destructive)
// Purpose: keep generator + editor in sync via localStorage keys and lightweight helpers.
// Does NOT touch UI/CSS and does NOT depend on any particular renderer.

(() => {
  if (window.__NEXORA_INVISIBLE_EDITOR__) return;
  window.__NEXORA_INVISIBLE_EDITOR__ = true;

  const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };

  function getSettings(){
    return safeParse(localStorage.getItem("nexora_last_settings_v1") || "null");
  }

  function setSettings(partial){
    const prev = getSettings() || {};
    const next = { ...prev, ...partial, savedAt: Date.now() };
    try{ localStorage.setItem("nexora_last_settings_v1", JSON.stringify(next)); }catch(e){}
    return next;
  }

  function setSelectedTemplate(tpl){
    try{
      if(tpl) localStorage.setItem("nexora_selected_template_v1", JSON.stringify(tpl));
      else localStorage.removeItem("nexora_selected_template_v1");
    }catch(e){}
  }

  function getSelectedTemplate(){
    return safeParse(localStorage.getItem("nexora_selected_template_v1") || "null");
  }

  // Expose minimal API
  window.NEXORA_INVISIBLE = {
    getSettings,
    setSettings,
    setSelectedTemplate,
    getSelectedTemplate,
    // Convenience: read the latest generated templates stored by index.html
    getTemplateForEditor(index){
      const list = window.NEXORA?.lastTemplates;
      if(Array.isArray(list) && list[index]) return list[index];
      return null;
    }
  };

  // Optional safety net: if user clicks a tile, ensure selected template is stored.
  // Index already handles this in openEditorWith, but we keep this as backup.
  document.addEventListener("click", (ev) => {
    const tile = ev.target?.closest?.(".tile");
    if(!tile) return;
    const parent = tile.parentElement;
    if(!parent) return;
    const tiles = Array.from(parent.querySelectorAll(".tile"));
    const idx = tiles.indexOf(tile);
    if(idx < 0) return;

    const tpl = window.NEXORA?.lastTemplates?.[idx];
    if(tpl){
      setSelectedTemplate(tpl);
      // Try to capture current form fields if present
      const prompt = document.getElementById("prompt")?.value?.trim?.() || "";
      const notes  = document.getElementById("notes")?.value?.trim?.() || "";
      const cat    = document.getElementById("cat")?.value || tpl.category || "";
      const style  = document.getElementById("style")?.value || tpl.style || "";
      const count  = parseInt(document.getElementById("count")?.value || "24", 10) || 24;
      setSettings({ prompt, notes, category: cat, style, count });
    }
  }, true);

  console.log("[Nexora] Invisible Editor bridge ready");
})();
