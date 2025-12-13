import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { category = "Instagram Post", style = "Dark Premium", count = 12 } = req.body || {};

    // 🔐 Safety check
    if (!process.env.OPENAI_API_KEY) {
      // Fallback so app NEVER breaks
      const fallback = Array.from({ length: count }, (_, i) => ({
        title: `${category} #${i + 1}`,
        description: `${style} • AI generated layout`
      }));
      return res.status(200).json({ templates: fallback });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
Generate ${count} design templates.
Category: ${category}
Style: ${style}

Return ONLY valid JSON like:
[
  { "title": "Template 1", "description": "Short description" }
]
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    let text = completion.choices[0].message.content.trim();

    // 🧠 Remove ```json wrappers if AI adds them
    text = text.replace(/```json|```/g, "").trim();

    const templates = JSON.parse(text);

    return res.status(200).json({ templates });

  } catch (err) {
    console.error("GENERATE ERROR:", err);

    // 🚑 Final safety fallback (NO 500 on UI)
    const safe = Array.from({ length: 12 }, (_, i) => ({
      title: `Instagram Post #${i + 1}`,
      description: `Dark Premium • AI generated layout`
    }));

    return res.status(200).json({ templates: safe });
  }
}
