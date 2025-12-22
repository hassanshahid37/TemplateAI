
/* Nexora design.js — Phase AC-V1 DOMINANCE FIX
   Poster-first composition with dominant hero zones
   Deterministic, no UI dependencies
*/

(function(){
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const hash=(s)=>{
    s=String(s||"");
    let h=2166136261;
    for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
    return (h>>>0);
  };
  const pick=(arr,seed)=>arr[(seed%arr.length+arr.length)%arr.length];

  const PALETTES=[
    {bg:"#0b1020",ink:"#ffffff",accent:"#2563eb",accent2:"#22c55e"},
    {bg:"#05040a",ink:"#ffffff",accent:"#22d3ee",accent2:"#fb7185"},
    {bg:"#071423",ink:"#f3f7ff",accent:"#38bdf8",accent2:"#a78bfa"},
  ];

  function dominantSplitHero({w,h,seed,brand,tagline,cta}){
    const pal=pick(PALETTES,seed);
    const els=[];

    // Background
    els.push({type:"bg",x:0,y:0,w,h,fill:pal.bg});

    // DOMINANT HERO BLOCK (65% width)
    const heroW=Math.round(w*0.65);
    els.push({
      type:"shape",
      x:0,y:0,w:heroW,h,
      fill:pal.accent,
      opacity:0.95
    });

    // Text safe column
    els.push({
      type:"text",
      x:Math.round(heroW*0.08),
      y:Math.round(h*0.18),
      text:brand.toUpperCase(),
      size:Math.round(h*0.08),
      weight:900,
      color:pal.ink
    });

    els.push({
      type:"text",
      x:Math.round(heroW*0.08),
      y:Math.round(h*0.36),
      text:tagline,
      size:Math.round(h*0.045),
      weight:600,
      color:pal.ink
    });

    // CTA isolated
    els.push({
      type:"pill",
      x:Math.round(heroW*0.08),
      y:Math.round(h*0.72),
      w:Math.round(heroW*0.42),
      h:Math.round(h*0.1),
      fill:pal.accent2,
      text:cta,
      tcolor:"#0b1020",
      tsize:Math.round(h*0.035),
      tweight:800
    });

    // Secondary contrast panel
    els.push({
      type:"shape",
      x:heroW,
      y:0,
      w:w-heroW,
      h:h,
      fill:"#ffffff",
      opacity:0.06
    });

    return els;
  }

  window.NexoraDesign={
    buildPoster({w,h,seed,brand,tagline,cta}){
      return {
        canvas:{w,h},
        elements: dominantSplitHero({w,h,seed,brand,tagline,cta})
      };
    }
  };
})();
