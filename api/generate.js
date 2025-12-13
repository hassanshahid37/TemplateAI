import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, count = 24 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional design assistant. Generate clean, structured template ideas.",
        },
        {
          role: "user",
          content: `Generate ${count} design templates for: ${prompt}. 
Return ONLY valid JSON in this format:
{
  "templates": [
    { "title": "...", "description": "..." }
  ]
}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const text = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text,
      });
    }

    return res.status(200).json({
      success: true,
      templates: parsed.templates || [],
    });
  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
}
