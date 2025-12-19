/* Nexora – design.js
   Visual template generator (client-side fallback + preview layouts)
   No external deps. Exposes window.NexoraDesign.
*/
(function(){
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const pick=(arr,seed)=>arr[(seed%arr.length+arr.length)%arr.length];
  const hash=(s)=>{
    s=String(s||"");
    let h=2166136261;
    for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h = Math.imul(h,16777619); }
    return (h>>>0);
  };

  const CATEGORIES = {
    "Instagram Post": { w:1080,h:1080, ratio:"1:1", kind:"social" },
    "Story": { w:1080,h:1920, ratio:"9:16", kind:"story" },
    "YouTube Thumbnail": { w:1280,h:720, ratio:"16:9", kind:"video" },
    "Flyer": { w:1080,h:1350, ratio:"4:5", kind:"print" },
    "Business Card": { w:1050,h:600, ratio:"7:4", kind:"print" },
    "Logo": { w:1000,h:1000, ratio:"1:1", kind:"logo" },
    "Presentation Slide": { w:1920,h:1080, ratio:"16:9", kind:"deck" },
    "Resume": { w:1240,h:1754, ratio:"A4-ish", kind:"doc" },
    "Poster": { w:1414,h:2000, ratio:"A3-ish", kind:"poster" }
  };

  const PALETTES = [
    { name:"Cobalt Night", bg:"#0b1020", bg2:"#0a2a5a", ink:"#f7f9ff", muted:"#b9c3d6", accent:"#2f7bff", accent2:"#9b5cff" },
    { name:"Emerald Studio", bg:"#071613", bg2:"#0b3a2b", ink:"#f4fffb", muted:"#b9d7cc", accent:"#2dd4bf", accent2:"#84cc16" },
    { name:"Sunset Premium", bg:"#140a12", bg2:"#3b0f2b", ink:"#fff6fb", muted:"#f3cfe0", accent:"#fb7185", accent2:"#f59e0b" },
    { name:"Mono Luxe", bg:"#0b0c10", bg2:"#1a1d29", ink:"#f6f7fb", muted:"#b4bbcb", accent:"#e5e7eb", accent2:"#60a5fa" }
  ];

  function brandFromPrompt(prompt){
    const p=(prompt||"").trim();
    if(!p) return { brand:"Nexora", tagline:"Premium templates, fast.", keywords:["premium","clean","modern"] };
    const words=p.replace(/\s+/g," ").split(" ").filter(Boolean);
    const brand = words.slice(0,3).join(" ");
    const tagline = words.slice(3,9).join(" ") || "Designed for your next post.";
    return { brand, tagline, keywords: words.slice(0,10) };
  }

// Prompt intent detection (drives visuals)
function intentFromPrompt(prompt){
  const p = (prompt||"").toLowerCase();
  const has = (...keys)=>keys.some(k=>p.includes(k));
  if(has("hiring","we are hiring","job","career","join our team","vacancy","position","recruit","recruiting","staff")) return "hiring";
  if(has("sale","discount","offer","limited","deal","promo","promotion","black friday","coupon","off","%")) return "sale";
  if(has("restaurant","food","burger","pizza","cafe","coffee","menu","delivery","kitchen")) return "food";
  if(has("gym","fitness","workout","training","yoga","coach")) return "fitness";
  if(has("real estate","property","home","house","apartment","rent","sale house")) return "realestate";
  if(has("app","saas","startup","software","ai","tech","product launch","launch","update")) return "tech";
  if(has("event","webinar","workshop","conference","meetup")) return "event";
  return "brand";
}



  // Phase H+: Smart inline "hero visuals" (no external URLs, so no 404s)
  // Generates prompt-aware SVG scenes (people/product/objects) as data URLs.
  function smartPhotoSrc(seed, pal, label, intent){
    const a = pal?.accent || "#4f8cff";
    const b = pal?.accent2 || "#22c55e";
    const bg = pal?.bg2 || pal?.bg || "#0b1220";
    const ink = pal?.ink || "#ffffff";
    const muted = pal?.muted || "rgba(255,255,255,0.72)";
    const txt = (label || "Nexora").toString().slice(0,18);
    const mode = (intent || "brand").toLowerCase();

    // Deterministic positions from seed
    const r1 = 110 + (seed % 160);
    const r2 = 80 + ((seed >> 3) % 170);
    const x1 = 240 + ((seed >> 5) % 520);
    const y1 = 220 + ((seed >> 7) % 420);
    const x2 = 700 + ((seed >> 9) % 360);
    const y2 = 520 + ((seed >> 11) % 300);

    // Small helpers
    const badge = (t)=>`<g transform="translate(72 78)">
      <rect x="0" y="0" rx="18" ry="18" width="${Math.max(160, 14*t.length+88)}" height="46" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>
      <text x="22" y="31" font-family="Poppins,system-ui,-apple-system,Segoe UI,Roboto,Arial" font-size="20" font-weight="800" fill="${muted}" letter-spacing="1.2">${escapeXML(t.toUpperCase())}</text>
    </g>`;

    // Scene primitives per intent
    const sceneHiring = () => {
      // three people silhouettes + desk + chat bubble
      const c1 = `rgba(255,255,255,0.12)`;
      const c2 = `rgba(255,255,255,0.08)`;
      const head = (cx,cy,r)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c1}"/>`;
      const body = (x,y,w,h)=>`<rect x="${x}" y="${y}" rx="${Math.round(w*0.45)}" ry="${Math.round(w*0.45)}" width="${w}" height="${h}" fill="${c2}"/>`;
      return `
        ${badge("Now Hiring")}
        <g transform="translate(560 170)">
          <rect x="0" y="0" rx="42" ry="42" width="520" height="360" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)"/>
          <g transform="translate(66 84)">
            ${head(90,64,36)}${body(54,104,72,118)}
            ${head(220,54,40)}${body(178,102,84,138)}
            ${head(360,68,34)}${body(330,110,64,112)}
            <rect x="10" y="250" rx="24" ry="24" width="420" height="64" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)"/>
            <rect x="40" y="266" rx="10" ry="10" width="210" height="14" fill="rgba(255,255,255,0.10)"/>
            <rect x="40" y="292" rx="10" ry="10" width="300" height="14" fill="rgba(255,255,255,0.08)"/>
            <g transform="translate(324 6)">
              <rect x="0" y="0" rx="22" ry="22" width="140" height="68" fill="url(#g)" opacity="0.85"/>
              <text x="18" y="44" font-family="Poppins,system-ui,-apple-system,Segoe UI,Roboto,Arial" font-size="18" font-weight="900" fill="#0b1020">APPLY</text>
            </g>
          </g>
        </g>`;
    };

    const sceneSale = () => {
      // product box + discount tag
      return `
        ${badge("Limited Offer")}
        <g transform="translate(600 160)">
          <rect x="0" y="0" rx="46" ry="46" width="480" height="390" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)"/>
          <g transform="translate(96 70)">
            <rect x="58" y="40" rx="26" ry="26" width="250" height="230" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)"/>
            <rect x="88" y="70" rx="16" ry="16" width="190" height="170" fill="url(#g)" opacity="0.78"/>
            <rect x="58" y="280" rx="20" ry="20" width="250" height="54" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)"/>
            <text x="86" y="316" font-family="Poppins,system-ui,-apple-system,Segoe UI,Roboto,Arial" font-size="22" font-weight="900" fill="${ink}">SHOP NOW</text>
            <g transform="translate(0 0)">
              <path d="M0,60 L44,10 L138,10 L94,60 Z" fill="${b}" opacity="0.95"/>
              <text x="20" y="44" font-family="Poppins,system-ui,-apple-system,Segoe UI,Roboto,Arial" font-size="16" font-weight="900" fill="#0b1020">-30%</text>
            </g>
          </g>
        </g>`;
    };

    const sceneTech = () => {
      // device + circuit lines
      return `
        ${badge("Product Update")}
        <g transform="translate(600 160)">
          <rect x="0" y="0" rx="46" ry="46" width="480" height="390" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)"/>
          <g transform="translate(86 70)">
            <rect x="70" y="30" rx="34" ry="34" width="250" height="300" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)"/>
            <rect x="98" y="70" rx="22" ry="22" width="194" height="190" fill="url(#g)" opacity="0.70"/>
            <rect x="120" y="278" rx="14" ry="14" width="150" height="22" fill="rgba(255,255,255,0.10)"/>
            <circle cx="195" cy="320" r="10" fill="rgba(255,255,255,0.14)"/>
            <path d="M0,310 C80,270 110,340 170,300 C250,246 270,330 360,288" stroke="rgba(255,255,255,0.12)" stroke-width="3" fill="none"/>
            <circle cx="28" cy="300" r="6" fill="${a}"/><circle cx="360" cy="288" r="6" fill="${b}"/>
          </g>
        </g>`;
    };

    const sceneEvent = () => {
      // ticket + calendar
      return `
        ${badge("Event")}
        <g transform="translate(600 170)">
          <rect x="0" y="0" rx="46" ry="46" width="480" height="360" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)"/>
          <g transform="translate(88 84)">
            <rect x="0" y="18" rx="28" ry="28" width="300" height="190" fill="url(#g)" opacity="0.72"/>
            <rect x="320" y="0" rx="28" ry="28" width="140" height="220" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)"/>
            <rect x="340" y="24" rx="10" ry="10" width="100" height="16" fill="rgba(255,255,255,0.12)"/>
            <rect x="340" y="56" rx="10" ry="10" width="76" height="16" fill="rgba(255,255,255,0.10)"/>
            <g transform="translate(340 92)">
              ${["#","*","•","•","•","•"].map((_,i)=>`<rect x="${(i%3)*34}" y="${Math.floor(i/3)*34}" rx="10" ry="10" width="26" height="26" fill="rgba(255,255,255,0.10)"/>`).join("")}
            </g>
            <rect x="22" y="50" rx="12" ry="12" width="130" height="22" fill="rgba(255,255,255,0.14)"/>
            <rect x="22" y="86" rx="12" ry="12" width="210" height="18" fill="rgba(255,255,255,0.10)"/>
          </g>
        </g>`;
    };

    const sceneFood = () => {
      // plate + garnish
      return `
        ${badge("Fresh Menu")}
        <g transform="translate(610 170)">
          <rect x="0" y="0" rx="46" ry="46" width="470" height="360" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)"/>
          <g transform="translate(90 74)">
            <circle cx="180" cy="170" r="120" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)"/>
            <circle cx="180" cy="170" r="86" fill="url(#g)" opacity="0.65"/>
            <rect x="280" y="58" rx="22" ry="22" width="90" height="220" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)"/>
            <rect x="20" y="44" rx="12" ry="12" width="120" height="18" fill="rgba(255,255,255,0.12)"/>
            <rect x="20" y="74" rx="12" ry="12" width="190" height="16" fill="rgba(255,255,255,0.10)"/>
            <circle cx="110" cy="190" r="18" fill="${b}" opacity="0.85"/>
            <circle cx="150" cy="220" r="14" fill="${a}" opacity="0.85"/>
          </g>
        </g>`;
    };

    const sceneFitness = () => {
      // dumbbell + pulse
      return `
        ${badge("Training")}
        <g transform="translate(610 170)">
          <rect x="0" y="0" rx="46" ry="46" width="470" height="360" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)"/>
          <g transform="translate(92 90)">
            <rect x="60" y="132" rx="18" ry="18" width="250" height="28" fill="rgba(255,255,255,0.12)"/>
            <rect x="22" y="100" rx="22" ry="22" width="56" height="92" fill="url(#g)" opacity="0.78"/>
            <rect x="310" y="100" rx="22" ry="22" width="56" height="92" fill="url(#g)" opacity="0.78"/>
            <path d="M0,240 L80,240 L110,208 L150,276 L188,226 L222,260 L280,260"
              stroke="rgba(255,255,255,0.14)" stroke-width="4" fill="none"/>
            <circle cx="110" cy="208" r="6" fill="${a}"/>
            <circle cx="150" cy="276" r="6" fill="${b}"/>
          </g>
        </g>`;
    };

    const sceneRealEstate = () => {
      // house + location pin
      return `
        ${badge("Property")}
        <g transform="translate(600 170)">
          <rect x="0" y="0" rx="46" ry="46" width="480" height="360" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)"/>
          <g transform="translate(102 86)">
            <path d="M40,120 L190,14 L340,120" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="86" y="118" rx="22" ry="22" width="208" height="170" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)"/>
            <rect x="166" y="188" rx="16" ry="16" width="48" height="100" fill="url(#g)" opacity="0.70"/>
            <rect x="110" y="154" rx="12" ry="12" width="56" height="40" fill="rgba(255,255,255,0.10)"/>
            <rect x="222" y="154" rx="12" ry="12" width="56" height="40" fill="rgba(255,255,255,0.10)"/>
            <g transform="translate(360 40)">
              <path d="M0,44 C0,20 18,0 44,0 C70,0 88,20 88,44 C88,86 44,128 44,128 C44,128 0,86 0,44 Z" fill="${a}" opacity="0.85"/>
              <circle cx="44" cy="44" r="16" fill="#0b1020" opacity="0.35"/>
            </g>
          </g>
        </g>`;
    };

    const sceneBrand = () => {
      // elegant abstract blobs
      return `
        ${badge("Premium")}
        <circle cx="${x1}" cy="${y1}" r="${r1}" fill="url(#g)" filter="url(#blur)" opacity="0.9"/>
        <circle cx="${x2}" cy="${y2}" r="${r2}" fill="url(#g)" filter="url(#blur)" opacity="0.85"/>`;
    };

    let scene = "";
    if(mode==="hiring") scene = sceneHiring();
    else if(mode==="sale") scene = sceneSale();
    else if(mode==="food") scene = sceneFood();
    else if(mode==="fitness") scene = sceneFitness();
    else if(mode==="realestate") scene = sceneRealEstate();
    else if(mode==="event") scene = sceneEvent();
    else if(mode==="tech") scene = sceneTech();
    else scene = sceneBrand();

    const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${b}" stop-opacity="0.90"/>
    </linearGradient>
    <radialGradient id="rg" cx="0.22" cy="0.18" r="0.95">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>

  <rect width="1200" height="800" fill="${bg}"/>
  <rect width="1200" height="800" fill="url(#rg)"/>

  ${scene}

  <path d="M0,640 C240,560 360,740 600,670 C820,608 920,520 1200,590 L1200,800 L0,800 Z"
        fill="#000000" opacity="0.14"/>

  <text x="64" y="742" font-family="Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="34" font-weight="800"
        fill="#ffffff" opacity="0.72">${escapeXML(txt)}</text>
</svg>`;

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }


  function escapeXML(str){
    return String(str)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function archetype(seed){
    const archetypes = [
      { name:"Split Hero", layout:"splitHero" },
      { name:"Badge Promo", layout:"badgePromo" },
      { name:"Minimal Quote", layout:"minimalQuote" },
      { name:"Feature Grid", layout:"featureGrid" },
      { name:"Big Number", layout:"bigNumber" },
      { name:"Photo Card", layout:"photoCard" }
    ];
    return pick(archetypes, seed);
  }

  function buildElements(layout, spec){
    const { w,h,pal,brand,tagline,seed,intent } = spec;
    const elements = [];
    const s = seed;

    const add = (el)=>{ elements.push(el); return el; };
    add({ type:"bg", x:0,y:0,w,h, fill: pal.bg, fill2: pal.bg2, style:"radial" });

    if(layout==="splitHero"){
      add({ type:"shape", x:0,y:0,w:Math.round(w*0.56),h, r:48, fill: pal.bg2, opacity:0.85 });
      add({ type:"shape", x:Math.round(w*0.53),y:Math.round(h*0.1),w:Math.round(w*0.42),h:Math.round(h*0.55), r:48, stroke:"rgba(255,255,255,0.14)", fill:"rgba(255,255,255,0.04)" });
      add({ type:"text", x:Math.round(w*0.07),y:Math.round(h*0.14), text: brand.toUpperCase(), size:Math.round(h*0.055), weight:800, color: pal.ink, letter: -0.5 });
      add({ type:"text", x:Math.round(w*0.07),y:Math.round(h*0.25), text: "NEW COLLECTION", size:Math.round(h*0.03), weight:700, color: pal.muted, letter: 2 });
      add({ type:"text", x:Math.round(w*0.07),y:Math.round(h*0.33), text: tagline, size:Math.round(h*0.038), weight:600, color: pal.ink });
      add({ type:"pill", x:Math.round(w*0.07),y:Math.round(h*0.72), w:Math.round(w*0.28),h:Math.round(h*0.085), r:999, fill: pal.accent, text:"Get Started", tcolor:"#0b1020", tsize:Math.round(h*0.032), tweight:800 });
      add({ type:"chip", x:Math.round(w*0.07),y:Math.round(h*0.82), text:"Premium • Fast • Ready", size:Math.round(h*0.028), color: pal.muted });
      add({ type:"photo", src: smartPhotoSrc(s+11, pal, brand, intent), x:Math.round(w*0.60),y:Math.round(h*0.16),w:Math.round(w*0.32),h:Math.round(h*0.38), r:40, stroke:"rgba(255,255,255,0.18)" });
    }

    if(layout==="badgePromo"){
      const badgeW=Math.round(w*0.22), badgeH=Math.round(h*0.11);
      add({ type:"shape", x:Math.round(w*0.08),y:Math.round(h*0.12),w:Math.round(w*0.84),h:Math.round(h*0.56), r:52, fill:"rgba(255,255,255,0.05)", stroke:"rgba(255,255,255,0.14)" });
      add({ type:"badge", x:Math.round(w*0.73),y:Math.round(h*0.09),w:badgeW,h:badgeH, r:22, fill: pal.accent2, text:"LIMITED", tcolor:"#0b1020", tsize:Math.round(h*0.03), tweight:900 });
      add({ type:"text", x:Math.round(w*0.12),y:Math.round(h*0.22), text: brand, size:Math.round(h*0.06), weight:900, color: pal.ink });
      add({ type:"text", x:Math.round(w*0.12),y:Math.round(h*0.31), text: "Flash Sale", size:Math.round(h*0.09), weight:900, color: pal.ink, letter:-1 });
      add({ type:"shape", x:Math.round(w*0.12),y:Math.round(h*0.46),w:Math.round(w*0.56),h:Math.round(h*0.01), r:8, fill:"rgba(255,255,255,0.16)" });
      add({ type:"pill", x:Math.round(w*0.12),y:Math.round(h*0.52), w:Math.round(w*0.34),h:Math.round(h*0.095), r:999, fill: pal.accent, text:"Get 30% Off", tcolor:"#0b1020", tsize:Math.round(h*0.035), tweight:900 });
      add({ type:"chip", x:Math.round(w*0.12),y:Math.round(h*0.65), text:"Use code: NEXORA", size:Math.round(h*0.03), color: pal.muted });
      add({ type:"shape", x:Math.round(w*0.70),y:Math.round(h*0.40),w:Math.round(w*0.18),h:Math.round(w*0.18), r:40, fill:"rgba(255,255,255,0.04)", stroke:"rgba(255,255,255,0.14)" });
    }

    if(layout==="minimalQuote"){
      add({ type:"shape", x:Math.round(w*0.10),y:Math.round(h*0.12),w:Math.round(w*0.80),h:Math.round(h*0.76), r:46, fill:"rgba(255,255,255,0.04)", stroke:"rgba(255,255,255,0.12)" });
      add({ type:"text", x:Math.round(w*0.16),y:Math.round(h*0.22), text:"“"+(tagline||"Create something memorable.")+"”", size:Math.round(h*0.06), weight:800, color: pal.ink, italic:true });
      add({ type:"text", x:Math.round(w*0.16),y:Math.round(h*0.52), text:"— "+brand, size:Math.round(h*0.035), weight:700, color: pal.muted });
      add({ type:"pill", x:Math.round(w*0.16),y:Math.round(h*0.66), w:Math.round(w*0.30),h:Math.round(h*0.08), r:999, fill: "rgba(255,255,255,0.06)", stroke:"rgba(255,255,255,0.16)", text:"Learn More", tcolor: pal.ink, tsize:Math.round(h*0.03), tweight:800 });
      add({ type:"dots", x:Math.round(w*0.74),y:Math.round(h*0.74), w:Math.round(w*0.14),h:Math.round(h*0.14), color:"rgba(255,255,255,0.14)" });
    }

    if(layout==="featureGrid"){
      add({ type:"text", x:Math.round(w*0.08),y:Math.round(h*0.12), text: brand, size:Math.round(h*0.055), weight:900, color: pal.ink });
      add({ type:"text", x:Math.round(w*0.08),y:Math.round(h*0.20), text: "What you get", size:Math.round(h*0.035), weight:700, color: pal.muted });
      const boxW=Math.round(w*0.40), boxH=Math.round(h*0.16);
      const startX=Math.round(w*0.08), startY=Math.round(h*0.30);
      for(let r=0;r<3;r++){
        for(let c=0;c<2;c++){
          const x=startX + c*(boxW+Math.round(w*0.04));
          const y=startY + r*(boxH+Math.round(h*0.03));
          add({ type:"shape", x,y,w:boxW,h:boxH, r:28, fill:"rgba(255,255,255,0.04)", stroke:"rgba(255,255,255,0.12)" });
          add({ type:"dot", x:x+22,y:y+22, r:8, fill: (c===0?pal.accent:pal.accent2) });
          add({ type:"text", x:x+44,y:y+16, text: pick(["Clean layout","Bold title","Smart spacing","Premium palette","Strong CTA","Easy edit"], (s+r*7+c*3)), size:Math.round(h*0.03), weight:800, color: pal.ink });
          add({ type:"text", x:x+44,y:y+50, text: pick(["Optimized typography","Designed for scroll","Balanced hierarchy","Readable and modern","Looks expensive","Canva-style"], (s+r*11+c*5)), size:Math.round(h*0.025), weight:600, color: pal.muted });
        }
      }
    }

    if(layout==="bigNumber"){
      const num = String((s%9)+1);
      add({ type:"text", x:Math.round(w*0.10),y:Math.round(h*0.18), text:"0"+num, size:Math.round(h*0.26), weight:900, color:"rgba(255,255,255,0.10)", letter:-6 });
      add({ type:"text", x:Math.round(w*0.10),y:Math.round(h*0.34), text: brand, size:Math.round(h*0.06), weight:900, color: pal.ink });
      add({ type:"text", x:Math.round(w*0.10),y:Math.round(h*0.44), text: tagline, size:Math.round(h*0.04), weight:700, color: pal.muted });
      add({ type:"pill", x:Math.round(w*0.10),y:Math.round(h*0.60), w:Math.round(w*0.34),h:Math.round(h*0.09), r:999, fill: pal.accent, text:"Join Now", tcolor:"#0b1020", tsize:Math.round(h*0.034), tweight:900 });
      add({ type:"shape", x:Math.round(w*0.62),y:Math.round(h*0.20),w:Math.round(w*0.28),h:Math.round(w*0.28), r:46, fill:"rgba(255,255,255,0.03)", stroke:"rgba(255,255,255,0.14)" });
    }

    if(layout==="photoCard"){
      add({ type:"shape", x:Math.round(w*0.08),y:Math.round(h*0.12),w:Math.round(w*0.84),h:Math.round(h*0.76), r:50, fill:"rgba(255,255,255,0.04)", stroke:"rgba(255,255,255,0.12)" });
      add({ type:"photo", src: smartPhotoSrc(s+37, pal, brand, intent), x:Math.round(w*0.58),y:Math.round(h*0.18),w:Math.round(w*0.30),h:Math.round(h*0.40), r:42, stroke:"rgba(255,255,255,0.18)" });
      add({ type:"text", x:Math.round(w*0.14),y:Math.round(h*0.22), text: brand, size:Math.round(h*0.06), weight:900, color: pal.ink });
      add({ type:"text", x:Math.round(w*0.14),y:Math.round(h*0.31), text: pick(["Grow your brand","Creative studio","Premium design","New launch","Build momentum","Meet your goals"], s), size:Math.round(h*0.075), weight:900, color: pal.ink, letter:-1 });
      add({ type:"text", x:Math.round(w*0.14),y:Math.round(h*0.44), text: tagline, size:Math.round(h*0.032), weight:650, color: pal.muted });
      add({ type:"pill", x:Math.round(w*0.14),y:Math.round(h*0.60), w:Math.round(w*0.30),h:Math.round(h*0.085), r:999, fill: pal.accent2, text:"Shop Now", tcolor:"#0b1020", tsize:Math.round(h*0.032), tweight:900 });
      add({ type:"chip", x:Math.round(w*0.14),y:Math.round(h*0.71), text:"@"+brand.replace(/\s+/g,"").toLowerCase(), size:Math.round(h*0.028), color: pal.muted });
    }

    return elements;
  }

  function generateOne(category, prompt, style, idx){
    const meta = CATEGORIES[category] || CATEGORIES["Instagram Post"];
    const seed = (hash(category+"|"+style+"|"+prompt) + idx*1013) >>> 0;
    const pal = pick(PALETTES, seed);
    const b = brandFromPrompt(prompt);
    const intent = intentFromPrompt(prompt);
    const arch = archetype(seed);

    const titleByCategory = {
      "Instagram Post": "Instagram Post #"+(idx+1),
      "Story": "Story #"+(idx+1),
      "YouTube Thumbnail": "YouTube Thumbnail #"+(idx+1),
      "Flyer": "Flyer #"+(idx+1),
      "Business Card": "Business Card #"+(idx+1),
      "Logo": "Logo #"+(idx+1),
      "Presentation Slide": "Slide #"+(idx+1),
      "Resume": "Resume #"+(idx+1),
      "Poster": "Poster #"+(idx+1)
    };

    const subtitle = (style||"Dark Premium") + " • " + arch.name;
    const elements = buildElements(arch.layout, {
      w: meta.w, h: meta.h, pal,
      brand: b.brand || "Nexora",
      tagline: b.tagline || "Premium templates, fast.",
      seed,
      intent
    });

    return {
      id: "tpl_"+seed.toString(16)+"_"+idx,
      title: titleByCategory[category] || (category+" #"+(idx+1)),
      subtitle,
      category,
      style: style || "Dark Premium",
      ratio: meta.ratio,
      canvas: { w: meta.w, h: meta.h },
      palette: pal,
      elements
    };
  }

  function generateTemplates(opts){
    const category = opts?.category || "Instagram Post";
    const prompt = opts?.prompt || "";
    const style = opts?.style || "Dark Premium";
    const count = clamp(parseInt(opts?.count ?? 24,10) || 24, 1, 200);
    const out=[];
    for(let i=0;i<count;i++) out.push(generateOne(category, prompt, style, i));
    return out;
  }

  function renderPreview(template, container){
    if(!container) return;
    container.innerHTML = "";
    const w=template?.canvas?.w||1080, h=template?.canvas?.h||1080;
    const boxW=container.clientWidth||260;
    const scale = boxW / w;
    const boxH = Math.max(120, Math.round(h*scale));
    container.style.height = boxH+"px";
    container.style.position="relative";
    container.style.overflow="hidden";
    container.style.borderRadius="14px";

    const mk = (tag)=>document.createElement(tag);
    const els = template?.elements || [];
    for(const e of els){
      if(e.type==="bg"){
        const d=mk("div");
        d.style.position="absolute"; d.style.left="0"; d.style.top="0";
        d.style.width="100%"; d.style.height="100%";
        d.style.background = e.style==="radial"
          ? `radial-gradient(120% 90% at 20% 10%, ${e.fill2}, ${e.fill})`
          : e.fill;
        container.appendChild(d);
        continue;
      }
      if(e.type==="shape"){
        const d=mk("div");
        d.style.position="absolute";
        d.style.left=(e.x*scale)+"px"; d.style.top=(e.y*scale)+"px";
        d.style.width=(e.w*scale)+"px"; d.style.height=(e.h*scale)+"px";
        d.style.borderRadius=((e.r||0)*scale)+"px";
        d.style.background=e.fill||"transparent";
        if(e.stroke) d.style.border=`${Math.max(1,Math.round(1.2*scale))}px solid ${e.stroke}`;
        if(e.opacity!=null) d.style.opacity=String(e.opacity);
        container.appendChild(d);
        continue;
      }
      if(e.type==="photo"){
        const d=mk("div");
        d.style.position="absolute";
        d.style.left=(e.x*scale)+"px"; d.style.top=(e.y*scale)+"px";
        d.style.width=(e.w*scale)+"px"; d.style.height=(e.h*scale)+"px";
        d.style.borderRadius=((e.r||0)*scale)+"px";
        d.style.background = e.src ? `url(${e.src})` : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))";
        if(e.src){ d.style.backgroundSize="cover"; d.style.backgroundPosition="center"; }
        d.style.border=`${Math.max(1,Math.round(1.2*scale))}px dashed ${e.stroke||"rgba(255,255,255,0.18)"}`;
        container.appendChild(d);
        continue;
      }
      if(e.type==="text"){
        const d=mk("div");
        d.style.position="absolute";
        d.style.left=(e.x*scale)+"px"; d.style.top=(e.y*scale)+"px";
        d.style.right="8px";
        d.style.color=e.color||"#fff";
        d.style.fontSize=Math.max(10, Math.round((e.size||28)*scale))+"px";
        d.style.fontWeight=e.weight||700;
        d.style.lineHeight="1.05";
        d.style.letterSpacing=(e.letter!=null? (e.letter*scale)+"px":"0px");
        d.style.whiteSpace="pre-wrap";
        if(e.italic) d.style.fontStyle="italic";
        d.textContent=e.text||"";
        container.appendChild(d);
        continue;
      }
      if(e.type==="pill" || e.type==="badge"){
        const d=mk("div");
        d.style.position="absolute";
        d.style.left=(e.x*scale)+"px"; d.style.top=(e.y*scale)+"px";
        d.style.width=(e.w*scale)+"px"; d.style.height=(e.h*scale)+"px";
        d.style.borderRadius=((e.r||999)*scale)+"px";
        d.style.background=e.fill||"rgba(255,255,255,0.1)";
        if(e.stroke) d.style.border=`${Math.max(1,Math.round(1.2*scale))}px solid ${e.stroke}`;
        d.style.display="flex";
        d.style.alignItems="center";
        d.style.justifyContent="center";
        d.style.color=e.tcolor||"#0b1020";
        d.style.fontWeight=e.tweight||900;
        d.style.fontSize=Math.max(10, Math.round((e.tsize||22)*scale))+"px";
        d.textContent=e.text||"";
        container.appendChild(d);
        continue;
      }
      if(e.type==="chip"){
        const d=mk("div");
        d.style.position="absolute";
        d.style.left=(e.x*scale)+"px"; d.style.top=(e.y*scale)+"px";
        d.style.color=e.color||"rgba(255,255,255,0.75)";
        d.style.fontSize=Math.max(10, Math.round((e.size||18)*scale))+"px";
        d.style.fontWeight="700";
        d.textContent=e.text||"";
        container.appendChild(d);
        continue;
      }
      if(e.type==="dots" || e.type==="dot"){
        const d=mk("div");
        d.style.position="absolute";
        d.style.left=(e.x*scale)+"px"; d.style.top=(e.y*scale)+"px";
        if(e.type==="dot"){
          d.style.width=(e.r*2*scale)+"px"; d.style.height=(e.r*2*scale)+"px";
          d.style.borderRadius="999px";
          d.style.background=e.fill||"rgba(255,255,255,0.2)";
        } else {
          d.style.width=(e.w*scale)+"px"; d.style.height=(e.h*scale)+"px";
          d.style.backgroundImage="radial-gradient(currentColor 1px, transparent 1px)";
          d.style.backgroundSize=`${Math.max(6,Math.round(10*scale))}px ${Math.max(6,Math.round(10*scale))}px`;
          d.style.color=e.color||"rgba(255,255,255,0.16)";
        }
        container.appendChild(d);
        continue;
      }
    }

    const g=mk("div");
    g.style.position="absolute"; g.style.left="-20%"; g.style.top="-30%";
    g.style.width="60%"; g.style.height="160%";
    g.style.transform="rotate(20deg)";
    g.style.background="linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)";
    container.appendChild(g);
  }

  window.NexoraDesign = { CATEGORIES, generateTemplates, renderPreview };
})();
