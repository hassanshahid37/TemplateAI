import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { category="Instagram Post", style="Dark Premium", prompt="", notes="", count=24 } = req.body || {};
    const n = Math.min(200, Math.max(1, parseInt(count || 24, 10)));

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: "You are a Canva-level template generator. Respond ONLY with valid JSON. No text outside JSON." },
        { role: "user", content:
`Generate ${n} premium templates for a 980x620 canvas.

Category: ${category}
Style: ${style}
User prompt: ${prompt}
Notes: ${notes}

Return STRICT JSON ONLY:

{
  "templates":[
    {
      "title":"${category} #1",
      "description":"1-line premium description",
      "canvas":{"w":980,"h":620},
      "elements":[
        {"x":80,"y":70,"w":560,"h":160,"title":"Headline","sub":"Support text"},
        {"x":80,"y":250,"w":420,"h":220,"title":"Key Point","sub":"Short benefit line"},
        {"x":540,"y":70,"w":360,"h":400,"title":"Image","sub":"Drop image here"},
        {"x":80,"y":500,"w":820,"h":90,"title":"CTA","sub":"Call to action"}
      ]
    }
  ]
}

Rules:
- 3–6 elements per template
- All elements must fit inside 980x620
- Strong hierarchy and modern spacing
- Text should be short, brand-ready
- JSON ONLY.` }
      ]
    });

    const content = completion?.choices?.[0]?.message?.content || "";
    const s = content.indexOf("{");
    const e = content.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("Non-JSON response");

    const data = JSON.parse(content.slice(s, e + 1));
    if (!Array.isArray(data.templates)) throw new Error("Missing templates");

    res.status(200).json({ success: true, templates: data.templates });
  } catch (err) {
    console.error("generate error", err);
    res.status(500).json({ error: "Generation failed" });
  }
}
