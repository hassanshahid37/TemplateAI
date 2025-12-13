import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { category = "Instagram Post", style = "Dark Premium", count = 24 } = req.body || {};

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
Generate ${count} ${category} template ideas.
Style: ${style}.
Return a JSON array where each item has:
- title
- description
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    // SAFE fallback parsing
    let templates = [];
    try {
      templates = JSON.parse(completion.choices[0].message.content);
    } catch {
      templates = Array.from({ length: count }, (_, i) => ({
        title: `${category} #${i + 1}`,
        description: `${style} • AI generated layout`
      }));
    }

    return res.status(200).json({ templates });
  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
