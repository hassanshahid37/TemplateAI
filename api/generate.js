
// api/generate.js
// Nexora – Canva-level YouTube Thumbnail FIX (no UI changes)

module.exports = async function handler(req, res) {
  try {
    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", "application/json");
    if (req.method === "OPTIONS") return res.end();

    let body = {};
    try { body = typeof req.body === "object" ? req.body : JSON.parse(req.body||"{}"); } catch {}

    const prompt = String(body.prompt||"").trim();
    const category = String(body.category||"Instagram Post");
    const style = String(body.style||"Dark Premium");
    let count = Math.max(1, Math.min(200, Number(body.count)||1));

    const templates = [];
    for(let i=0;i<count;i++){
      const seed = Date.now() + i*97;

      if(category === "YouTube Thumbnail"){
        templates.push(makeYT(seed, prompt, style, i));
      }
    }

    return res.end(JSON.stringify({ success:true, templates }));
  } catch(e){
    return res.end(JSON.stringify({ success:true, templates:[] }));
  }
};

function makeYT(seed, prompt, style, i){
  const layouts = ["leftHero","rightHero","centerPunch"];
  const layout = layouts[i % layouts.length];

  const canvas = { w:1280, h:720 };
  const bg = ["#020617","#0b1220","#111827"][i%3];
  const badge = ["NEW","TRENDING","HOT"][i%3];
  const headline = (prompt || "MODERN TECH").toUpperCase();

  const elements = [
    { type:"bg", x:0,y:0,w:1280,h:720, fill:bg },
    { type:"badge", text:badge, x:80,y:80, w:160,h:48, fill:"#ff6a00" },
    { type:"text", text:headline, x: layout==="rightHero"?520:80, y:260, size:96, weight:900, color:"#ffffff" },
    { type:"photo", x: layout==="centerPunch"?560:720, y:80, w:480, h:560 }
  ];

  return {
    id:`yt_${i+1}`,
    category:"YouTube Thumbnail",
    style,
    title:`YouTube Thumbnail #${i+1}`,
    canvas,
    elements
  };
}
