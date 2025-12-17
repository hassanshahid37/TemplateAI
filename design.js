
/* Nexora – design.js (Browser-safe version) */
(function(){
  const NexoraDesign = {};

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const pick=(arr,seed)=>arr[(seed%arr.length+arr.length)%arr.length];
  const hash=(s)=>{
    s=String(s||"");
    let h=2166136261;
    for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h = Math.imul(h,16777619); }
    return (h>>>0);
  };

  const PALETTES = [
    { bg:"#0b1020", bg2:"#0a2a5a", ink:"#f7f9ff", muted:"#b9c3d6" },
    { bg:"#071613", bg2:"#0b3a2b", ink:"#f4fffb", muted:"#b9d7cc" },
    { bg:"#140a12", bg2:"#3b0f2b", ink:"#fff6fb", muted:"#f3cfe0" }
  ];

  function generateTemplates(opts){
    const count = clamp(parseInt(opts?.count||24,10),1,200);
    const prompt = opts?.prompt || "";
    const category = opts?.category || "Instagram Post";
    const style = opts?.style || "Dark Premium";
    const out = [];

    for(let i=0;i<count;i++){
      const seed = hash(prompt + category + style + i);
      const pal = pick(PALETTES, seed);
      const title = prompt ? prompt.slice(0, 32) : `${category} #${i+1}`;

      out.push({
        id:`tpl_${seed}_${i}`,
        title,
        subtitle:`${style} • Ready`,
        category,
        canvas:{w:1080,h:1080},
        palette:pal,
        elements:[
          {type:"bg", x:0,y:0,w:1080,h:1080, fill:pal.bg},
          {type:"text", x:80,y:160, text:title, size:64, weight:800, color:pal.ink},
          {type:"text", x:80,y:260, text:prompt || "Premium template", size:32, weight:600, color:pal.muted}
        ]
      });
    }
    return out;
  }

  function renderPreview(template, container){
    if(!template || !container) return;
    container.innerHTML = "";
    container.style.background = template.palette.bg;
    container.style.borderRadius = "14px";
    container.style.padding = "12px";
    container.innerHTML = `<div style="color:${template.palette.ink};font-weight:700">${template.title}</div>`;
  }

  NexoraDesign.generateTemplates = generateTemplates;
  NexoraDesign.renderPreview = renderPreview;
  window.NexoraDesign = NexoraDesign;
})();
