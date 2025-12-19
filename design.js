/* Nexora – design.js
   Visual template generator (client-side fallback + preview layouts)
   No external deps. Exposes window.NexoraDesign.

   Goal (Phase I–J): generate *Canva-style* premium templates with:
   - real layout variety (hero, product spotlight, editorial, quote, grid, poster)
   - prompt-intent → layout + copy + badge + CTA
   - inline SVG “photos” (no external URLs → no 404s)
*/
(function(){
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const pick=(arr,seed)=>arr[(seed%arr.length+arr.length)%arr.length];
  const hash=(s)=>{
    s=String(s||"");
    let h=2166136261;
    for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
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
    { name:"Mono Luxe", bg:"#0b0c10", bg2:"#1a1d29", ink:"#f6f7fb", muted:"#b4bbcb", accent:"#e5e7eb", accent2:"#60a5fa" },
    // light-ish premium (still works in dark UI)
    { name:"Crystal Light", bg:"#0a0f1e", bg2:"#172a4a", ink:"#ffffff", muted:"rgba(255,255,255,.78)", accent:"#60a5fa", accent2:"#fbbf24" },
  ];

  function escapeXML(str){
    return String(str)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  // Inline SVG "photo" (deterministic, no external URLs)
  function smartPhotoSrc(seed, pal, label){
    const a = pal?.accent || "#4f8cff";
    const b = pal?.accent2 || "#22c55e";
    const bg = pal?.bg2 || pal?.bg || "#0b1220";
    const txt = (label || "Nexora").toString().slice(0,18);

    const r1 = 120 + (seed % 140);
    const r2 = 90 + ((seed >> 3) % 160);
    const x1 = 260 + ((seed >> 5) % 420);
    const y1 = 240 + ((seed >> 7) % 420);
    const x2 = 620 + ((seed >> 9) % 360);
    const y2 = 520 + ((seed >> 11) % 360);

    const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${b}" stop-opacity="0.90"/>
    </linearGradient>
    <radialGradient id="rg" cx="0.25" cy="0.2" r="0.95">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>

  <rect width="1200" height="800" fill="${bg}"/>
  <rect width="1200" height="800" fill="url(#rg)"/>

  <circle cx="${x1}" cy="${y1}" r="${r1}" fill="url(#g)" filter="url(#blur)" opacity="0.9"/>
  <circle cx="${x2}" cy="${y2}" r="${r2}" fill="url(#g)" filter="url(#blur)" opacity="0.85"/>

  <path d="M0,640 C240,560 360,740 600,670 C820,608 920,520 1200,590 L1200,800 L0,800 Z" fill="#000000" opacity="0.14"/>

  <text x="64" y="116" font-family="Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="64" font-weight="800" fill="#ffffff" opacity="0.92">${escapeXML(txt)}</text>
  <text x="64" y="170" font-family="Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="26" font-weight="600" fill="#ffffff" opacity="0.60">Auto image • Nexora</text>
</svg>`;

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  function normalizeWords(prompt){
    const p=(prompt||"").toString().trim();
    return p.replace(/[\n\r\t]+/g," ").replace(/\s+/g," ").trim();
  }

  function extractBrand(prompt){
    const p=normalizeWords(prompt);
    if(!p) return "Nexora";
    const low=p.toLowerCase();

    // Handle "my name is X" / "brand: X"
    const m1 = low.match(/\bmy name is\s+([a-z0-9\-\s]{2,30})/i);
    if(m1 && m1[1]) return m1[1].trim().replace(/\s+/g," ").split(" ").slice(0,3).join(" ");
    const m2 = low.match(/\bbrand\s*[:\-]\s*([a-z0-9\-\s]{2,30})/i);
    if(m2 && m2[1]) return m2[1].trim().replace(/\s+/g," ").split(" ").slice(0,3).join(" ");

    // Else: first 1–3 meaningful tokens
    const words = p.split(" ").filter(Boolean);
    return words.slice(0,3).join(" ");
  }

  function detectIntent(prompt){
    const p=normalizeWords(prompt);
    const low=p.toLowerCase();
    const has=(re)=>re.test(low);

    if(!low) return { kind:"generic", tone:"premium" };

    if(has(/\b(real\s*estate|property|apartment|villa|rent|listing|open\s*house)\b/)) return { kind:"realestate", tone:"luxury" };
    if(has(/\b(restaurant|cafe|coffee|pizza|burger|menu|dine|chef)\b/)) return { kind:"food", tone:"warm" };
    if(has(/\b(fitness|gym|workout|training|yoga|challenge|fat\s*loss)\b/)) return { kind:"fitness", tone:"bold" };
    if(has(/\b(sale|discount|offer|limited|deal|promo|flash)\b/)) return { kind:"sale", tone:"bold" };
    if(has(/\b(event|webinar|workshop|conference|meetup|launch\b)\b/)) return { kind:"event", tone:"modern" };
    if(has(/\b(quote|motivation|inspire|mindset|affirmation)\b/)) return { kind:"quote", tone:"minimal" };
    if(has(/\b(product|skincare|serum|shoes|watch|bottle|phone|app)\b/)) return { kind:"product", tone:"premium" };
    if(has(/\b(agency|studio|creative|portfolio|design)\b/)) return { kind:"studio", tone:"premium" };

    return { kind:"generic", tone:"premium" };
  }

  function makeCopy(seed, category, prompt, pal){
    const brand = extractBrand(prompt);
    const intent = detectIntent(prompt);
    const cat = category || "Instagram Post";

    // Simple deterministic variants
    const v = (seed % 6);
    const ctaByKind = {
      sale: ["Shop Now","Claim Offer","Get 30% Off","Save Today","Limited Drop","Order Now"],
      event:["Register","Save Your Seat","Join Live","Get Tickets","RSVP Now","Learn More"],
      product:["Buy Now","Explore","See Details","Get Yours","Try It","Shop Collection"],
      realestate:["Book Viewing","See Details","Call Now","Get Quote","Schedule Tour","Explore"],
      food:["Order Now","See Menu","Reserve","Try Today","Visit Us","Get Deal"],
      fitness:["Start Today","Join Challenge","Get Plan","Train Now","Free Trial","Let’s Go"],
      quote:["Save Post","Share","Follow","Learn More","Get Inspired","Keep Going"],
      studio:["Start Project","Book Call","View Work","Get Started","Contact","Explore"],
      generic:["Get Started","Learn More","Explore","Shop Now","Join Now","Try It"]
    };
    const badgeByKind = {
      sale:["LIMITED","FLASH","NEW","TODAY","HOT","DEAL"],
      event:["LIVE","NEW","2025","FREE","HOT","VIP"],
      product:["NEW","PREMIUM","DROP","BEST","PRO","LUXE"],
      realestate:["OPEN","NEW","LUXE","VIEW","HOT","TOP"],
      food:["NEW","SPECIAL","FRESH","HOT","MENU","CHEF"],
      fitness:["DAY 1","NEW","GO","PRO","START","NOW"],
      quote:["QUOTE","DAILY","NOW","MIND","CALM","FOCUS"],
      studio:["STUDIO","PRO","NEW","CREATIVE","WORK","DESIGN"],
      generic:["NEW","PRO","NOW","LIMITED","PREMIUM","HOT"]
    };

    const cta = pick(ctaByKind[intent.kind] || ctaByKind.generic, seed);
    const badge = pick(badgeByKind[intent.kind] || badgeByKind.generic, seed>>2);

    const headlineBank = {
      sale:["Limited Time Offer","New Collection Drop","Sale Starts Now","Premium Deal","Flash Sale Today","Upgrade Your Look"],
      event:["Join the Live Session","Workshop Starts Soon","Launch Event","Build Faster Together","Level Up Today","Live Webinar"],
      product:["Designed to Stand Out","Premium. Clean. Modern.","A Better Everyday","Your New Favorite","Minimal Product Drop","Made for You"],
      realestate:["Luxury Living, Simplified","Your Next Home Awaits","Modern Apartments","Dream Villa Tour","Prime Location","Move-in Ready"],
      food:["Fresh. Fast. Delicious.","Today’s Special","A New Menu Drop","Coffee & Comfort","Taste the Difference","Made with Love"],
      fitness:["Start Your Challenge","Train Smarter","New Routine","Stronger Every Day","Build Momentum","Level Up Fitness"],
      quote:["Keep Going.","Stay Consistent.","Small Steps, Big Wins.","Make it Happen.","Choose Progress.","You’ve Got This."],
      studio:["Creative Studio","Premium Brand Design","Make It Look Expensive","Design That Converts","Modern Visual System","Build a Brand"],
      generic:["Grow Your Brand","Premium Templates","Modern Design","Built for Conversions","Create Faster","Make It Look Premium"]
    };
    const headline = pick(headlineBank[intent.kind] || headlineBank.generic, seed>>1);

    const subBank = {
      sale:["Clean typography • bold hierarchy • ready to post","High impact layout • premium spacing • instant edits","Strong CTA • modern shapes • scroll-stopping"],
      event:["Schedule • speakers • topics • CTA","Clean agenda • modern layout • high readability","Perfect for promo + reminders + slides"],
      product:["Product first • strong contrast • premium grid","Minimal, elegant, and easy to customize","Designed for ads, promos, and product drops"],
      realestate:["Price • location • features • CTA","Luxury vibe • crisp layout • clear details","Perfect for listings, open houses, and ads"],
      food:["Menu highlights • location • CTA","Warm palette • bold headline • clean spacing","Perfect for specials, combos, and promos"],
      fitness:["Plan • schedule • CTA","Bold headline • strong contrast • high energy","Perfect for challenges, programs, and gyms"],
      quote:["Minimal type • premium spacing • calm layout","Designed to be shared • saved • remembered","Clean and readable on mobile"],
      studio:["Brand voice • hierarchy • modern grid","Looks like a paid Canva pack","Clean, bold, and conversion-focused"],
      generic:["Modern premium aesthetic • built for conversions","Clean typography • bold hierarchy • strong spacing","High-impact layout • ready for social"]
    };
    const sub = pick(subBank[intent.kind] || subBank.generic, seed>>3);

    // Slightly smarter title for the grid card (what user sees under thumbnails)
    const title = (intent.kind === "quote")
      ? pick(["Daily Motivation","Quote Post","Mindset Vibes","Calm Typography","Minimal Quote","Inspiration"], seed)
      : (intent.kind === "sale")
        ? pick(["Flash Sale","New Drop","Limited Offer","Deal Poster","Promo Card","Discount Ad"], seed)
        : (intent.kind === "realestate")
          ? pick(["Listing Highlight","Open House","Luxury Listing","Property Ad","Home Tour","Real Estate Post"], seed)
          : (intent.kind === "food")
            ? pick(["Today’s Special","Menu Promo","Combo Deal","Cafe Post","New Dish","Restaurant Ad"], seed)
            : (intent.kind === "event")
              ? pick(["Event Promo","Workshop","Webinar Invite","Launch Invite","Live Session","Conference"], seed)
              : pick(["Awesome Vibes","Modern Promo","Premium Post","Brand Growth","Clean Layout","New Creative"], seed);

    // Optional numeric highlight for posters/slides
    const number = String(((seed % 9) + 1));
    const price = pick(["$29","$49","$99","$199","30% OFF","Buy 1 Get 1"], seed>>4);

    // Category-aware tweaks
    const safeHeadline = (cat === "YouTube Thumbnail")
      ? (headline.toUpperCase().slice(0, 26))
      : headline;

    return {
      brand,
      intent,
      title,
      headline: safeHeadline,
      sub,
      badge,
      cta,
      handle: "@" + brand.replace(/\s+/g,"").toLowerCase().slice(0,14),
      price,
      ink: pal?.ink,
      muted: pal?.muted
    };
  }

  function archetype(seed, categoryKind, intentKind){
    // Intent-based archetype routing (more variety + feels intentional)
    const base = [
      { name:"Split Hero", layout:"splitHero" },
      { name:"Badge Promo", layout:"badgePromo" },
      { name:"Minimal Quote", layout:"minimalQuote" },
      { name:"Feature Grid", layout:"featureGrid" },
      { name:"Photo Card", layout:"photoCard" },
      { name:"Editorial", layout:"editorial" },
      { name:"Product Spotlight", layout:"productSpotlight" },
      { name:"Poster Stack", layout:"posterStack" }
    ];

    if(intentKind === "quote") return pick(base.filter(a=>["minimalQuote","editorial"].includes(a.layout)), seed);
    if(intentKind === "sale")  return pick(base.filter(a=>["badgePromo","posterStack","splitHero"].includes(a.layout)), seed);
    if(intentKind === "product") return pick(base.filter(a=>["productSpotlight","photoCard","editorial"].includes(a.layout)), seed);
    if(intentKind === "event") return pick(base.filter(a=>["posterStack","featureGrid","splitHero"].includes(a.layout)), seed);
    if(intentKind === "realestate") return pick(base.filter(a=>["photoCard","splitHero","posterStack"].includes(a.layout)), seed);
    if(intentKind === "food") return pick(base.filter(a=>["photoCard","badgePromo","editorial"].includes(a.layout)), seed);
    if(intentKind === "fitness") return pick(base.filter(a=>["posterStack","badgePromo","splitHero"].includes(a.layout)), seed);

    // Category hints
    if(categoryKind === "video") return pick(base.filter(a=>["splitHero","badgePromo","editorial"].includes(a.layout)), seed);
    if(categoryKind === "deck") return pick(base.filter(a=>["featureGrid","editorial","splitHero"].includes(a.layout)), seed);

    return pick(base, seed);
  }

  function buildElements(layout, spec){
    const { w,h,pal,seed,copy } = spec;
    const elements=[];
    const add=(el)=>{ elements.push(el); return el; };

    // Background base
    add({ type:"bg", x:0,y:0,w,h, fill: pal.bg, fill2: pal.bg2, style:"radial" });

    const pad = Math.round(Math.min(w,h)*0.07);
    const radiusBig = Math.round(Math.min(w,h)*0.05);
    const radiusMed = Math.round(Math.min(w,h)*0.032);

    const headlineSize = Math.round(h*0.085);
    const subSize = Math.round(h*0.034);

    // Helpers
    const glass = (x,y,ww,hh,r)=> add({ type:"shape", x,y,w:ww,h:hh, r:r||radiusBig, fill:"rgba(255,255,255,0.04)", stroke:"rgba(255,255,255,0.14)" });

    if(layout === "splitHero"){
      add({ type:"shape", x:0,y:0,w:Math.round(w*0.56),h, r:radiusBig, fill: pal.bg2, opacity:0.86 });
      glass(Math.round(w*0.54), Math.round(h*0.10), Math.round(w*0.42), Math.round(h*0.58), radiusBig);
      add({ type:"badge", x:pad, y:pad, w:Math.round(w*0.22), h:Math.round(h*0.075), r:999, fill: pal.accent2, text: copy.badge, tcolor:"#0b1020", tsize:Math.round(h*0.03), tweight:900 });
      add({ type:"text", x:pad, y:Math.round(h*0.20), text: copy.headline, size:headlineSize, weight:900, color: pal.ink, letter:-1 });
      add({ type:"text", x:pad, y:Math.round(h*0.34), text: copy.sub, size:subSize, weight:650, color: pal.muted });
      add({ type:"pill", x:pad, y:Math.round(h*0.72), w:Math.round(w*0.30), h:Math.round(h*0.085), r:999, fill: pal.accent, text: copy.cta, tcolor:"#0b1020", tsize:Math.round(h*0.032), tweight:900 });
      add({ type:"chip", x:pad, y:Math.round(h*0.82), text: copy.handle, size:Math.round(h*0.028), color: pal.muted });
      add({ type:"photo", src: smartPhotoSrc(seed+11, pal, copy.brand), x:Math.round(w*0.60), y:Math.round(h*0.18), w:Math.round(w*0.32), h:Math.round(h*0.36), r:radiusBig, stroke:"rgba(255,255,255,0.18)" });
    }

    if(layout === "badgePromo"){
      glass(pad, pad, Math.round(w*0.84), Math.round(h*0.64), radiusBig);
      add({ type:"badge", x:Math.round(w*0.72), y:Math.round(h*0.10), w:Math.round(w*0.22), h:Math.round(h*0.075), r:24, fill: pal.accent2, text: copy.badge, tcolor:"#0b1020", tsize:Math.round(h*0.03), tweight:900 });
      add({ type:"text", x:Math.round(w*0.12), y:Math.round(h*0.22), text: copy.brand, size:Math.round(h*0.05), weight:800, color: pal.muted, letter:1 });
      add({ type:"text", x:Math.round(w*0.12), y:Math.round(h*0.30), text: copy.headline, size:Math.round(h*0.11), weight:900, color: pal.ink, letter:-2 });
      add({ type:"text", x:Math.round(w*0.12), y:Math.round(h*0.46), text: copy.sub, size:subSize, weight:650, color: pal.muted });
      add({ type:"pill", x:Math.round(w*0.12), y:Math.round(h*0.58), w:Math.round(w*0.38), h:Math.round(h*0.090), r:999, fill: pal.accent, text: copy.cta, tcolor:"#0b1020", tsize:Math.round(h*0.034), tweight:900 });
      add({ type:"chip", x:Math.round(w*0.12), y:Math.round(h*0.70), text: "Use code: NEXORA", size:Math.round(h*0.03), color: pal.muted });
      // corner ornament
      add({ type:"shape", x:Math.round(w*0.70), y:Math.round(h*0.44), w:Math.round(w*0.18), h:Math.round(w*0.18), r:radiusMed, fill:"rgba(255,255,255,0.04)", stroke:"rgba(255,255,255,0.14)" });
    }

    if(layout === "minimalQuote"){
      glass(Math.round(w*0.10), Math.round(h*0.12), Math.round(w*0.80), Math.round(h*0.76), radiusBig);
      add({ type:"text", x:Math.round(w*0.16), y:Math.round(h*0.22), text: "\u201c"+copy.headline+"\u201d", size:Math.round(h*0.075), weight:900, color: pal.ink, italic:true });
      add({ type:"text", x:Math.round(w*0.16), y:Math.round(h*0.50), text: copy.sub, size:Math.round(h*0.032), weight:650, color: pal.muted });
      add({ type:"pill", x:Math.round(w*0.16), y:Math.round(h*0.66), w:Math.round(w*0.34), h:Math.round(h*0.08), r:999,
        fill:"rgba(255,255,255,0.06)", stroke:"rgba(255,255,255,0.16)", text: copy.cta, tcolor: pal.ink, tsize:Math.round(h*0.03), tweight:800 });
      add({ type:"chip", x:Math.round(w*0.16), y:Math.round(h*0.78), text: "\u2014 "+copy.brand, size:Math.round(h*0.03), color: pal.muted });
    }

    if(layout === "featureGrid"){
      add({ type:"text", x:pad, y:pad, text: copy.brand, size:Math.round(h*0.055), weight:900, color: pal.ink });
      add({ type:"text", x:pad, y:Math.round(h*0.16), text: copy.headline, size:Math.round(h*0.04), weight:800, color: pal.muted });
      const boxW=Math.round(w*0.40), boxH=Math.round(h*0.15);
      const startX=pad, startY=Math.round(h*0.26);
      for(let r=0;r<3;r++){
        for(let c=0;c<2;c++){
          const x=startX + c*(boxW+Math.round(w*0.04));
          const y=startY + r*(boxH+Math.round(h*0.03));
          add({ type:"shape", x,y,w:boxW,h:boxH, r:radiusMed, fill:"rgba(255,255,255,0.04)", stroke:"rgba(255,255,255,0.12)" });
          add({ type:"dot", x:x+Math.round(boxH*0.22), y:y+Math.round(boxH*0.30), r:Math.round(boxH*0.08), fill: (c===0?pal.accent:pal.accent2) });
          add({ type:"text", x:x+Math.round(boxH*0.46), y:y+Math.round(boxH*0.18),
            text: pick(["Clean hierarchy","Bold headline","Premium spacing","Strong CTA","Modern grid","Easy edit"], seed+r*11+c*5),
            size:Math.round(h*0.03), weight:800, color: pal.ink });
          add({ type:"text", x:x+Math.round(boxH*0.46), y:y+Math.round(boxH*0.48),
            text: pick(["Designed to convert","Optimized for scroll","Readable on mobile","Looks like paid packs","Brand-ready","Fast to customize"], seed+r*17+c*7),
            size:Math.round(h*0.025), weight:650, color: pal.muted });
        }
      }
      add({ type:"pill", x:pad, y:Math.round(h*0.86), w:Math.round(w*0.30), h:Math.round(h*0.075), r:999,
        fill: pal.accent, text: copy.cta, tcolor:"#0b1020", tsize:Math.round(h*0.03), tweight:900 });
    }

    if(layout === "photoCard"){
      glass(Math.round(w*0.08), Math.round(h*0.12), Math.round(w*0.84), Math.round(h*0.76), radiusBig);
      add({ type:"photo", src: smartPhotoSrc(seed+37, pal, copy.brand), x:Math.round(w*0.58), y:Math.round(h*0.18), w:Math.round(w*0.30), h:Math.round(h*0.42), r:radiusBig, stroke:"rgba(255,255,255,0.18)" });
      add({ type:"badge", x:Math.round(w*0.14), y:Math.round(h*0.16), w:Math.round(w*0.20), h:Math.round(h*0.07), r:999, fill:"rgba(255,255,255,0.08)", stroke:"rgba(255,255,255,0.18)",
        text: copy.badge, tcolor: pal.ink, tsize:Math.round(h*0.028), tweight:900 });
      add({ type:"text", x:Math.round(w*0.14), y:Math.round(h*0.28), text: copy.headline, size:Math.round(h*0.09), weight:900, color: pal.ink, letter:-1 });
      add({ type:"text", x:Math.round(w*0.14), y:Math.round(h*0.44), text: copy.sub, size:subSize, weight:650, color: pal.muted });
      add({ type:"pill", x:Math.round(w*0.14), y:Math.round(h*0.60), w:Math.round(w*0.30), h:Math.round(h*0.085), r:999,
        fill: pal.accent2, text: copy.cta, tcolor:"#0b1020", tsize:Math.round(h*0.032), tweight:900 });
      add({ type:"chip", x:Math.round(w*0.14), y:Math.round(h*0.72), text: copy.handle, size:Math.round(h*0.028), color: pal.muted });
    }

    if(layout === "editorial"){
      // premium editorial strip + photo + big type
      add({ type:"shape", x:0, y:Math.round(h*0.62), w, h:Math.round(h*0.38), r:0, fill:"rgba(0,0,0,0.18)" });
      add({ type:"photo", src: smartPhotoSrc(seed+91, pal, copy.brand), x:Math.round(w*0.08), y:Math.round(h*0.12), w:Math.round(w*0.52), h:Math.round(h*0.46), r:radiusBig, stroke:"rgba(255,255,255,0.18)" });
      add({ type:"badge", x:Math.round(w*0.64), y:Math.round(h*0.14), w:Math.round(w*0.26), h:Math.round(h*0.07), r:999,
        fill: pal.accent, text: copy.badge, tcolor:"#0b1020", tsize:Math.round(h*0.028), tweight:900 });
      add({ type:"text", x:Math.round(w*0.64), y:Math.round(h*0.26), text: copy.brand.toUpperCase(), size:Math.round(h*0.035), weight:900, color: pal.muted, letter: 2 });
      add({ type:"text", x:Math.round(w*0.64), y:Math.round(h*0.32), text: copy.headline, size:Math.round(h*0.09), weight:900, color: pal.ink, letter:-1 });
      add({ type:"text", x:Math.round(w*0.64), y:Math.round(h*0.48), text: copy.sub, size:Math.round(h*0.032), weight:650, color: pal.muted });
      add({ type:"pill", x:Math.round(w*0.64), y:Math.round(h*0.70), w:Math.round(w*0.26), h:Math.round(h*0.08), r:999,
        fill:"rgba(255,255,255,0.08)", stroke:"rgba(255,255,255,0.16)", text: copy.cta, tcolor: pal.ink, tsize:Math.round(h*0.03), tweight:800 });
    }

    if(layout === "productSpotlight"){
      // product hero with price, feature list, and big photo
      glass(pad, pad, Math.round(w*0.84), Math.round(h*0.80), radiusBig);
      add({ type:"badge", x:pad+12, y:pad+12, w:Math.round(w*0.20), h:Math.round(h*0.075), r:999, fill: pal.accent2,
        text: copy.badge, tcolor:"#0b1020", tsize:Math.round(h*0.03), tweight:900 });
      add({ type:"text", x:pad+12, y:Math.round(h*0.22), text: copy.headline, size:Math.round(h*0.10), weight:900, color: pal.ink, letter:-2 });
      add({ type:"text", x:pad+12, y:Math.round(h*0.40), text: copy.sub, size:Math.round(h*0.032), weight:650, color: pal.muted });
      // feature bullets
      const feats = ["Premium materials","Clean minimal design","Ready for ads","Fast to customize"]; 
      for(let i=0;i<3;i++){
        const y = Math.round(h*0.52) + i*Math.round(h*0.06);
        add({ type:"dot", x:pad+18, y:y+6, r:7, fill: (i%2?pal.accent2:pal.accent) });
        add({ type:"text", x:pad+44, y, text: pick(feats, seed+i*9), size:Math.round(h*0.028), weight:750, color: pal.ink });
      }
      add({ type:"pill", x:pad+12, y:Math.round(h*0.76), w:Math.round(w*0.28), h:Math.round(h*0.085), r:999,
        fill: pal.accent, text: copy.cta, tcolor:"#0b1020", tsize:Math.round(h*0.032), tweight:900 });
      add({ type:"chip", x:pad+Math.round(w*0.30), y:Math.round(h*0.79), text: "From "+copy.price, size:Math.round(h*0.03), color: pal.muted });
      add({ type:"photo", src: smartPhotoSrc(seed+151, pal, copy.brand), x:Math.round(w*0.58), y:Math.round(h*0.22), w:Math.round(w*0.30), h:Math.round(h*0.46), r:radiusBig, stroke:"rgba(255,255,255,0.18)" });
    }

    if(layout === "posterStack"){
      // high-impact poster with big type, badge, and layered cards
      add({ type:"text", x:pad, y:Math.round(h*0.14), text: copy.brand, size:Math.round(h*0.05), weight:800, color: pal.muted, letter: 1 });
      add({ type:"text", x:pad, y:Math.round(h*0.22), text: copy.headline, size:Math.round(h*0.13), weight:900, color: pal.ink, letter:-2 });
      add({ type:"badge", x:pad, y:Math.round(h*0.40), w:Math.round(w*0.22), h:Math.round(h*0.075), r:999, fill: pal.accent2,
        text: copy.badge, tcolor:"#0b1020", tsize:Math.round(h*0.03), tweight:900 });
      add({ type:"text", x:pad, y:Math.round(h*0.50), text: copy.sub, size:Math.round(h*0.032), weight:650, color: pal.muted });

      // layered cards
      add({ type:"shape", x:Math.round(w*0.56), y:Math.round(h*0.22), w:Math.round(w*0.34), h:Math.round(h*0.24), r:radiusBig, fill:"rgba(255,255,255,0.06)", stroke:"rgba(255,255,255,0.16)" });
      add({ type:"shape", x:Math.round(w*0.52), y:Math.round(h*0.42), w:Math.round(w*0.38), h:Math.round(h*0.26), r:radiusBig, fill:"rgba(255,255,255,0.05)", stroke:"rgba(255,255,255,0.14)" });
      add({ type:"photo", src: smartPhotoSrc(seed+211, pal, copy.brand), x:Math.round(w*0.58), y:Math.round(h*0.28), w:Math.round(w*0.30), h:Math.round(h*0.36), r:radiusBig, stroke:"rgba(255,255,255,0.18)" });

      add({ type:"pill", x:pad, y:Math.round(h*0.76), w:Math.round(w*0.34), h:Math.round(h*0.085), r:999,
        fill: pal.accent, text: copy.cta, tcolor:"#0b1020", tsize:Math.round(h*0.032), tweight:900 });
      add({ type:"chip", x:pad, y:Math.round(h*0.87), text: copy.handle + " • " + copy.price, size:Math.round(h*0.028), color: pal.muted });
    }

    return elements;
  }

  function generateOne(category, prompt, style, idx){
    const meta = CATEGORIES[category] || CATEGORIES["Instagram Post"];
    const seed = (hash(category+"|"+style+"|"+prompt) + idx*1013) >>> 0;
    const pal = pick(PALETTES, seed);

    const copy = makeCopy(seed, category, prompt, pal);
    const arch = archetype(seed, meta.kind, copy.intent.kind);

    const subtitle = (style||"Dark Premium") + " • " + arch.name + " • " + pal.name;
    const elements = buildElements(arch.layout, { w: meta.w, h: meta.h, pal, seed, copy });

    return {
      id: "tpl_"+seed.toString(16)+"_"+idx,
      title: copy.title + " #" + (idx+1),
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
    const count = clamp(parseInt(opts?.count ?? 24, 10) || 24, 1, 200);
    const out=[];
    for(let i=0;i<count;i++) out.push(generateOne(category, prompt, style, i));
    return out;
  }

  // Kept for compatibility (not used by current index thumbnail renderer, but useful for debug)
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
        d.style.background = e.fill2
          ? `radial-gradient(120% 90% at 20% 10%, ${e.fill2}, ${e.fill})`
          : (e.fill || "#0b1020");
        container.appendChild(d);
        continue;
      }

      const d=mk("div");
      d.style.position="absolute";
      d.style.left = Math.round((e.x||0)*scale)+"px";
      d.style.top  = Math.round((e.y||0)*scale)+"px";
      d.style.width = Math.max(2, Math.round((e.w||120)*scale))+"px";
      d.style.height = Math.max(2, Math.round((e.h||40)*scale))+"px";
      d.style.borderRadius = Math.max(10, Math.round((e.r||14)*scale))+"px";

      const t = String(e.type||"").toLowerCase();
      if(t==="photo"){
        d.style.backgroundImage = `url(${e.src})`;
        d.style.backgroundSize="cover";
        d.style.backgroundPosition="center";
        d.style.border = e.stroke || "1px solid rgba(255,255,255,0.18)";
        container.appendChild(d);
        continue;
      }

      if(["shape"].includes(t)){
        d.style.background = e.fill || "rgba(255,255,255,0.06)";
        d.style.border = e.stroke || "1px solid rgba(255,255,255,0.14)";
        container.appendChild(d);
        continue;
      }

      if(["pill","badge"].includes(t)){
        d.style.background = e.fill || "rgba(255,255,255,0.08)";
        d.style.border = e.stroke || "1px solid rgba(255,255,255,0.14)";
        d.style.display="flex";
        d.style.alignItems="center";
        d.style.justifyContent="center";
        d.style.fontSize = Math.max(9, Math.round((e.tsize||14)*scale))+"px";
        d.style.fontWeight = String(e.tweight||800);
        d.style.color = e.tcolor || "#fff";
        d.textContent = String(e.text||"").slice(0,16);
        container.appendChild(d);
        continue;
      }

      if(["text"].includes(t)){
        d.style.background = "transparent";
        d.style.border = "none";
        d.style.color = e.color || "#fff";
        d.style.fontWeight = String(e.weight||800);
        d.style.fontSize = Math.max(10, Math.round((e.size||22)*scale))+"px";
        d.style.lineHeight = "1.1";
        d.style.whiteSpace = "nowrap";
        d.style.overflow = "hidden";
        d.style.textOverflow = "ellipsis";
        d.textContent = String(e.text||"").slice(0, 32);
        container.appendChild(d);
        continue;
      }

      if(["dot"].includes(t)){
        d.style.width = Math.max(6, Math.round((e.r||6)*2*scale))+"px";
        d.style.height = d.style.width;
        d.style.borderRadius = "999px";
        d.style.background = e.fill || "rgba(255,255,255,0.4)";
        d.style.border = "none";
        container.appendChild(d);
        continue;
      }
    }
  }

  window.NexoraDesign = { generateTemplates, renderPreview };
})();
