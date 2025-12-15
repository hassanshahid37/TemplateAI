export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY missing" });

  try {
    const {
      prompt = "",
      count = 24,
      category = "Instagram Post",
      style = "Dark Premium",
      notes = ""
    } = req.body || {};

    // Allow empty prompt by turning it into a useful default (so users can click once and get results)
    const safePrompt = (String(prompt).trim() || `Generate premium ${category} templates in ${style} style.`);

    const schemaHint = `Return STRICT JSON ONLY in this exact format:
{
  "templates":[
    {
      "id":"t1",
      "title":"Template title",
      "description":"One-line description for the tile",
      "category":"${category}",
      "style":"${style}",
      "canvas":{"w":980,"h":620},
      "elements":[
        {"x":80,"y":70,"w":820,"h":120,"title":"HEADLINE","sub":"Short headline"},
        {"x":80,"y":210,"w":620,"h":110,"title":"SUBHEAD","sub":"Supporting line"},
        {"x":80,"y":350,"w":360,"h":110,"title":"CTA","sub":"Call to action"},
        {"x":520,"y":350,"w":380,"h":210,"title":"IMAGE","sub":"Image placeholder"}
      ]
    }
  ]
}`;

    const userMsg = `You are a premium template generator for a Canva-style editor.
Generate ${Math.min(Math.max(parseInt(count,10)||24,1),200)} DISTINCT templates for category: ${category}.
Style: ${style}.
User prompt: ${safePrompt}
Notes: ${notes}

Rules:
- Return ONLY valid JSON (no markdown, no comments).
- Make templates DISTINCT (different layouts and element placements).
- Elements must fit within canvas 980x620.
- Use 3 to 7 elements per template.
- element fields must be: x,y,w,h,title,sub (all required).

${schemaHint}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: "Respond ONLY with valid JSON. No extra text." },
          { role: "user", content: userMsg }
        ]
      })
    });

    const raw = await response.json();
    const content = raw.choices?.[0]?.message?.content || "";
    let data;
    try { data = JSON.parse(content); } catch { throw new Error("Invalid JSON from OpenAI"); }

    if (!Array.isArray(data.templates) || !data.templates.length) throw new Error("Templates array missing");

    // Normalize & validate
    const templates = data.templates.map((t, i) => ({
      id: t.id || `ai_${Date.now()}_${i+1}`,
      title: t.title || `${category} #${i+1}`,
      description: t.description || `${style} • AI layout`,
      category: t.category || category,
      style: t.style || style,
      canvas: { w: 980, h: 620 },
      elements: (Array.isArray(t.elements) ? t.elements : []).slice(0, 12).map((e) => ({
        x: Number(e.x), y: Number(e.y),
        w: Number(e.w), h: Number(e.h),
        title: String(e.title ?? "TEXT"),
        sub: String(e.sub ?? "")
      }))
    })).filter(t => t.elements.length >= 3);

    if (!templates.length) throw new Error("No usable templates returned");

    return res.status(200).json({ success: true, templates });
  } catch (err) {
    // Safe fallback: still return real, structured templates (no crashes)
    const count = 24;
    const patterns = [
      (i)=> ([
        { x: 80, y: 70,  w: 820, h: 120, title: "HEADLINE", sub: "Bold offer / value prop" },
        { x: 80, y: 210, w: 620, h: 110, title: "SUBHEAD",  sub: "One sentence benefit + context" },
        { x: 80, y: 350, w: 360, h: 110, title: "CTA",      sub: "Shop now • Learn more • Sign up" },
        { x: 520,y: 350, w: 380, h: 210, title: "IMAGE",    sub: "Photo / product placeholder" }
      ]),
      (i)=> ([
        { x: 70, y: 80,  w: 420, h: 150, title: "TITLE",    sub: "Clean modern headline" },
        { x: 70, y: 250, w: 420, h: 170, title: "DETAILS",  sub: "3 key points • feature • feature" },
        { x: 520,y: 80,  w: 390, h: 360, title: "IMAGE",    sub: "Hero image placeholder" }
      ]),
      (i)=> ([
        { x: 300,y: 70,  w: 360, h: 90,  title: "BADGE",    sub: "NEW • LIMITED • SALE" },
        { x: 160,y: 190, w: 660, h: 150, title: "HEADLINE", sub: "Premium centered typography" },
        { x: 200,y: 360, w: 580, h: 120, title: "CTA",      sub: "Call to action + urgency" }
      ])
    ];

    const templates = Array.from({ length: count }).map((_, i) => ({
      id: `fb_${Date.now()}_${i+1}`,
      title: `Template #${i+1}`,
      description: "Dark Premium • Structured layout",
      category: "General",
      style: "Dark Premium",
      canvas: { w: 980, h: 620 },
      elements: patterns[i % patterns.length](i+1)
    }));

    return res.status(200).json({
      success: true,
      warning: "AI failed — returned structured fallback templates",
      templates
    });
  }
}
