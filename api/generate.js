import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res){
  if(req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try{
    const { prompt="", count=24, category="Instagram Post", style="Dark Premium", notes="" } = req.body || {};
    const n = Math.min(Math.max(parseInt(count,10)||24, 1), 200);
    const safePrompt = String(prompt||"").trim() || `Generate premium ${category} templates in ${style} style.`;

    const schema = `Return STRICT JSON ONLY:
{
 "templates":[
  {
   "id":"tpl_01",
   "title":"Bold Promo Post",
   "description":"High-contrast promo layout",
   "category":"${category}",
   "style":"${style}",
   "canvas":{"w":1080,"h":1080,"background":"#050712"},
   "elements":[
     {"type":"shape","x":0,"y":0,"w":1080,"h":360,"fill":"#0b5fff"},
     {"type":"text","role":"headline","text":"Launch Your Brand","x":80,"y":90,"fontSize":76,"fontWeight":900,"color":"#ffffff"},
     {"type":"text","role":"body","text":"Premium designs that convert","x":80,"y":190,"fontSize":30,"fontWeight":600,"color":"rgba(255,255,255,.85)"},
     {"type":"image","role":"hero","x":80,"y":420,"w":920,"h":580}
   ]
  }
 ]
}`;

    const msg = `You are a senior graphic designer and creative director.
Create ${n} DISTINCT Canva-style templates.

Category: ${category}
Style: ${style}
User prompt: ${safePrompt}
Notes: ${String(notes||"")}

Hard rules:
- Return ONLY valid JSON (no markdown).
- Every template MUST include: canvas.background + 3-8 elements.
- Use types: shape, text, image.
- Use strong hierarchy: headline > body > cta.
- Make each template visually different (different layout + placements).
- Keep everything within 1080x1080.
- Prefer dark premium aesthetics unless user requests otherwise.
- Colors must be hex or rgba strings.

${schema}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.75,
      messages: [
        { role:"system", content:"Respond ONLY with valid JSON. No extra text." },
        { role:"user", content: msg }
      ]
    });

    const content = completion.choices?.[0]?.message?.content || "";
    const data = JSON.parse(content);

    if(!Array.isArray(data.templates) || !data.templates.length) throw new Error("templates missing");

    // light validation + normalization
    const templates = data.templates.slice(0, n).map((t, i) => ({
      id: t.id || `ai_${Date.now()}_${i+1}`,
      title: t.title || `${category} #${i+1}`,
      description: t.description || `${style} • Visual layout`,
      category: t.category || category,
      style: t.style || style,
      canvas: {
        w: 1080, h: 1080,
        background: (t.canvas && t.canvas.background) ? String(t.canvas.background) : "#050712"
      },
      elements: (Array.isArray(t.elements) ? t.elements : []).slice(0, 12).map((e) => ({
        type: e.type || "text",
        role: e.role || "",
        x: Number(e.x ?? 80), y: Number(e.y ?? 80),
        w: Number(e.w ?? 420), h: Number(e.h ?? 120),
        fill: e.fill || null,
        text: e.text || null,
        fontSize: Number(e.fontSize ?? 36),
        fontWeight: Number(e.fontWeight ?? 700),
        color: e.color || null
      })).filter(e => Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.w) && Number.isFinite(e.h))
    })).filter(t => t.elements.length >= 3);

    if(!templates.length) throw new Error("No usable templates");

    return res.status(200).json({ success:true, templates });
  }catch(err){
    // Fallback: still return premium visual templates
    const templates = Array.from({length: 24}).map((_,i)=>({
      id:`fb_${Date.now()}_${i+1}`,
      title:`Premium Template #${i+1}`,
      description:"Dark Premium • Visual layout",
      category:"General",
      style:"Dark Premium",
      canvas:{ w:1080, h:1080, background:"#050712" },
      elements:[
        { type:"shape", x:0,y:0,w:1080,h:360, fill:"#0b5fff" },
        { type:"text", role:"headline", text:"Premium Design", x:80,y:90, fontSize:76, fontWeight:900, color:"#ffffff" },
        { type:"text", role:"body", text:"Canva-style layout with hierarchy", x:80,y:190, fontSize:30, fontWeight:600, color:"rgba(255,255,255,.85)" },
        { type:"image", role:"hero", x:80,y:420,w:920,h:580 }
      ]
    }));
    return res.status(200).json({ success:true, warning:String(err?.message||err), templates });
  }
}
