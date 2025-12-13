import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const prompt = req.body?.prompt || "Create premium social media templates";

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You generate design templates. Always return valid JSON only.",
        },
        {
          role: "user",
          content: `
Return JSON ONLY in this format:

{
  "templates": [
    { "title": "Instagram Post #1", "category": "Instagram" },
    { "title": "Instagram Post #2", "category": "Instagram" }
  ]
}

Topic: ${prompt}
Generate 24 items.
`,
        },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(200).json({
        success: true,
        templates: fallbackTemplates(),
        warning: "AI returned invalid JSON, fallback used",
        source: "fallback",
      });
    }

    return res.status(200).json({
      success: true,
      templates: parsed.templates || fallbackTemplates(),
      source: "ai",
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      templates: fallbackTemplates(),
      error: err.message,
      source: "fallback",
    });
  }
}

function fallbackTemplates() {
  return Array.from({ length: 24 }).map((_, i) => ({
    title: `Template #${i + 1}`,
    category: "General",
  }));
}
