import OpenAI from "openai";

const client = new OpenAI({
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

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional Canva-style template generator. Return only clean JSON.",
        },
        {
          role: "user",
          content: `
Generate ${count} premium design templates based on this idea:
"${prompt}"

Return ONLY valid JSON in this format:
{
  "templates": [
    {
      "title": "Template title",
      "subtitle": "Short subtitle",
      "description": "One-line description"
    }
  ]
}
`,
        },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content;
    const parsed = JSON.parse(raw);

    return res.status(200).json({
      success: true,
      templates: parsed.templates || [],
    });
  } catch (error) {
    console.error("GENERATION ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "AI generation failed",
      details: error.message,
    });
  }
}
