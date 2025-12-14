export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY missing" });

  try {
    const { category="Instagram Post", style="Dark Premium", prompt="", notes="", count=24 } = req.body || {};
    const n = Math.min(200, Math.max(1, parseInt(count || 24, 10)));

    const system = "You generate Canva-level layouts. Output STRICT JSON only. No markdown. No extra text.";
    const user = `
Generate ${n} premium templates for a 980x620 canvas.

Category: ${category}
Style: ${style}
Prompt: ${prompt}
Notes: ${notes}

Return STRICT JSON only:

{
  "templates":[
    {
      "title":"${category} #1",
      "description":"1-line premium description",
      "elements":[
        { "x":120, "y":110, "w":740, "h":160, "title":"Headline text", "sub":"Support text" },
        { "x":120, "y":290, "w":520, "h":150, "title":"Feature", "sub":"Short benefit" },
        { "x":680, "y":110, "w":260, "h":330, "title":"Image", "sub":"Drop image here" }
      ]
    }
  ]
}

Rules:
- elements must fit 980x620
- 3–6 elements per template
- strong hierarchy, premium spacing
- use short, brand-ready text
- JSON only
`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    const raw = await r.json();
    const content = raw?.choices?.[0]?.message?.content || "";
    const s = content.indexOf("{");
    const e = content.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("AI returned non-JSON");

    const data = JSON.parse(content.slice(s, e + 1));
    if (!Array.isArray(data.templates)) throw new Error("templates missing");

    res.status(200).json({ success: true, templates: data.templates });
  } catch (err) {
    console.error("generate error:", err);
    // Let frontend fall back to local engine
    res.status(500).json({ error: "AI generation failed" });
  }
}
