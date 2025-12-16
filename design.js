// Nexora / design.js
// Phase C — Category-based Real Template Engine (v1)

export function generateTemplates(count = 36, category = "All") {
  const engines = {
    Instagram: instagramTemplates,
    Story: storyTemplates,
    YouTube: youtubeTemplates,
    Flyer: flyerTemplates,
    Poster: posterTemplates,
    Presentation: presentationTemplates,
    BusinessCard: businessCardTemplates,
    Resume: resumeTemplates,
    Logo: logoTemplates
  };

  let pool = [];
  if (category === "All") {
    Object.values(engines).forEach(fn => pool.push(...fn()));
  } else if (engines[category]) {
    pool = engines[category]();
  }
  return pool.slice(0, count);
}

function tpl(title, w, h, bg, elements, meta = {}) {
  return { title, category: meta.category || "General", canvas:{width:w,height:h,background:bg}, elements };
}

function h(text,x,y,w,size,align="left"){return{type:"heading",text,x,y,width:w,fontSize:size,fontWeight:800,color:"#fff",align};}
function t(text,x,y,w,size){return{type:"text",text,x,y,width:w,fontSize:size,fontWeight:500,color:"rgba(255,255,255,.9)"};}
function img(x,y,w,h,r=24){return{type:"image",x,y,width:w,height:h,radius:r};}
function shape(x,y,w,h,c,r=24){return{type:"shape",x,y,width:w,height:h,fill:c,radius:r};}
function btn(text,x,y){return{type:"button",text,x,y,width:240,height:60,background:"#0b5fff",color:"#fff",radius:999,fontSize:16,fontWeight:700};}

/* INSTAGRAM */
function instagramTemplates(){
  return [tpl("Instagram Promo",1080,1080,"linear-gradient(135deg,#0b5fff,#7b5cff)",[
    h("New Collection",120,260,840,92,"center"),
    t("Minimal • Bold • Modern",320,380,440,26),
    img(240,460,600,420),
    btn("Shop Now",420,920)
  ],{category:"Instagram"})];
}

/* STORY */
function storyTemplates(){
  return [tpl("Story Promo",1080,1920,"linear-gradient(180deg,#0b5fff,#000)",[
    h("Limited Offer",120,420,840,96,"center"),
    img(140,620,800,900),
    btn("Swipe Up",420,1580)
  ],{category:"Story"})];
}

/* YOUTUBE */
function youtubeTemplates(){
  return [tpl("YouTube Thumbnail",1280,720,"linear-gradient(135deg,#ff4d6d,#0b1020)",[
    img(760,120,420,480),
    h("You Won’t Believe This",60,260,640,86)
  ],{category:"YouTube"})];
}

/* FLYER */
function flyerTemplates(){
  return [tpl("Business Flyer",1080,1350,"linear-gradient(180deg,#0b1020,#000)",[
    img(120,120,840,420),
    h("Creative Agency",120,580,840,86,"center"),
    t("Branding • Marketing • Design",240,700,600,26),
    btn("Contact Us",420,860)
  ],{category:"Flyer"})];
}

/* POSTER */
function posterTemplates(){
  return [tpl("Marketing Poster",1080,1600,"linear-gradient(180deg,#111,#222)",[
    img(120,140,840,520),
    h("Grow Your Business",120,720,840,92,"center"),
    t("Strategy • Ads • Design",300,850,480,26),
    btn("Get Started",420,980)
  ],{category:"Poster"})];
}

/* PRESENTATION */
function presentationTemplates(){
  return [tpl("Presentation Slide",1600,900,"linear-gradient(135deg,#0b5fff,#07130f)",[
    h("Company Overview",80,260,720,88),
    t("Mission • Vision • Growth",80,380,640,26),
    img(880,220,560,420)
  ],{category:"Presentation"})];
}

/* BUSINESS CARD */
function businessCardTemplates(){
  return [tpl("Business Card",1050,600,"linear-gradient(135deg,#000,#333)",[
    h("Alex Johnson",60,200,600,52),
    t("Creative Director",60,270,600,22),
    t("alex@nexora.ai",60,340,600,22)
  ],{category:"BusinessCard"})];
}

/* RESUME */
function resumeTemplates(){
  return [tpl("Resume",1080,1400,"#f4f4f4",[
    shape(0,0,360,1400,"#0b5fff",0),
    h("Alex Johnson",400,140,600,72),
    t("Product Designer",400,230,600,26),
    h("Experience",400,360,600,48),
    t("• Senior Designer at Studio",400,430,600,24)
  ],{category:"Resume"})];
}

/* LOGO */
function logoTemplates(){
  return [tpl("Logo Mark",800,800,"linear-gradient(135deg,#0b5fff,#7b5cff)",[
    h("N",260,260,280,240,"center")
  ],{category:"Logo"})];
}
