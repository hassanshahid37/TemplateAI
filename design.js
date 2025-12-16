// Nexora / design.js
// Phase A COMPLETE — Canva-grade Static Layout Library (v1)
// Layout-first. Premium. Deterministic. UI-agnostic.

export function generateTemplates(count = 24) {
  const layouts = [
    heroProduct,
    imageLedPoster,
    minimalType,
    quoteCard,
    saleBanner,
    eventPoster,
    brandSplit,
    testimonial,
    featureHighlight,
    announcement,
    luxuryPoster,
    boldCTA,
    storyIntro,
    newsletter,
    comparison
  ];

  const palettes = [
    { bg:"linear-gradient(135deg,#0b5fff,#7b5cff)", ink:"#ffffff", accent:"#7b5cff" },
    { bg:"linear-gradient(135deg,#07130f,#00c389)", ink:"#ffffff", accent:"#00c389" },
    { bg:"linear-gradient(135deg,#1f1409,#ffcc66)", ink:"#fff7ed", accent:"#ffcc66" },
    { bg:"linear-gradient(135deg,#0b1020,#00d1ff)", ink:"#ffffff", accent:"#00d1ff" },
    { bg:"linear-gradient(135deg,#1a0b14,#ff4d6d)", ink:"#ffffff", accent:"#ff4d6d" }
  ];

  const out = [];
  for (let i = 0; i < count; i++) {
    const l = layouts[i % layouts.length];
    const p = palettes[i % palettes.length];
    out.push(l(i, p));
  }
  return out;
}

/* =====================
   LAYOUT ARCHETYPES
   ===================== */

function heroProduct(i,p){
  return tpl(`Hero Product #${i+1}`,p,[
    h("Launch Your Brand",80,200,820,110,p.ink),
    t("Designed for growth and clarity",80,340,520,30),
    btn("Get Started",80,420,p.accent),
    img(640,160,300,520)
  ]);
}

function imageLedPoster(i,p){
  return tpl(`Image Poster #${i+1}`,p,[
    img(80,120,920,520),
    h("Experience More",120,680,840,90,p.ink),
  ]);
}

function minimalType(i,p){
  return tpl(`Minimal Type #${i+1}`,p,[
    h("Simplicity Wins",120,360,840,120,p.ink,"center")
  ]);
}

function quoteCard(i,p){
  return tpl(`Quote #${i+1}`,p,[
    h("Design is thinking made visual.",120,330,840,110,p.ink,"center"),
    t("— Premium Quote",120,480,840,28,"center")
  ]);
}

function saleBanner(i,p){
  return tpl(`Sale #${i+1}`,p,[
    badge("LIMITED",80,180,p.accent),
    h("30% OFF",80,280,820,140,p.ink),
    btn("Shop Now",80,460,p.accent)
  ]);
}

function eventPoster(i,p){
  return tpl(`Event #${i+1}`,p,[
    h("Design Conference",120,300,840,90,p.ink,"center"),
    divider(340,410,400),
    t("September 2025 · Online",120,450,840,28,"center"),
    btn("Reserve Spot",400,520,p.accent)
  ]);
}

function brandSplit(i,p){
  return tpl(`Brand Split #${i+1}`,p,[
    img(80,180,360,360),
    h("Build a Brand",500,260,480,90,p.ink),
    t("That people remember",500,380,420,28)
  ]);
}

function testimonial(i,p){
  return tpl(`Testimonial #${i+1}`,p,[
    h("What our users say",120,240,840,80,p.ink,"center"),
    t("\"This changed how we design.\"",120,360,840,36,"center")
  ]);
}

function featureHighlight(i,p){
  return tpl(`Feature #${i+1}`,p,[
    h("Fast. Clean. Powerful.",80,260,780,96,p.ink),
    t("Everything you need in one place",80,380,520,30),
    img(640,260,300,300)
  ]);
}

function announcement(i,p){
  return tpl(`Announcement #${i+1}`,p,[
    h("We’re Live!",120,340,840,120,p.ink,"center"),
    btn("Explore Now",420,500,p.accent)
  ]);
}

function luxuryPoster(i,p){
  return tpl(`Luxury #${i+1}`,p,[
    h("Exclusive Edition",120,300,840,100,p.ink,"center"),
    divider(360,430,360),
    t("Crafted with intention",120,470,840,28,"center")
  ]);
}

function boldCTA(i,p){
  return tpl(`Bold CTA #${i+1}`,p,[
    h("Ready to Start?",80,300,780,120,p.ink),
    btn("Join Today",80,460,p.accent)
  ]);
}

function storyIntro(i,p){
  return tpl(`Story #${i+1}`,p,[
    h("Every journey starts here",120,260,840,96,p.ink,"center"),
    img(240,420,600,360)
  ]);
}

function newsletter(i,p){
  return tpl(`Newsletter #${i+1}`,p,[
    h("Weekly Design Tips",80,260,780,96,p.ink),
    t("Straight to your inbox",80,380,520,30),
    btn("Subscribe",80,450,p.accent)
  ]);
}

function comparison(i,p){
  return tpl(`Comparison #${i+1}`,p,[
    h("Before vs After",120,220,840,90,p.ink,"center"),
    img(120,360,360,300),
    img(600,360,360,300)
  ]);
}

/* =====================
   HELPERS
   ===================== */

function tpl(title,p,elements){
  return { title, canvas:{width:1080,height:1080,background:p.bg}, elements };
}
function h(text,x,y,w,size,color,align="left"){return{type:"heading",text,x,y,width:w,fontSize:size,fontWeight:800,color,align};}
function t(text,x,y,w,size,align="left"){return{type:"text",text,x,y,width:w,fontSize:size,fontWeight:500,color:"rgba(255,255,255,.85)",align};}
function btn(text,x,y,color){return{type:"button",text,x,y,width:260,height:64,background:color,color:"#fff",radius:999,fontSize:18,fontWeight:700};}
function img(x,y,w,h){return{type:"image",x,y,width:w,height:h};}
function badge(text,x,y,color){return{type:"badge",text,x,y,width:200,height:54,background:color,color:"#fff",radius:999,fontSize:16,fontWeight:800};}
function divider(x,y,w){return{type:"divider",x,y,width:w,height:2,color:"rgba(255,255,255,.35)"};}
