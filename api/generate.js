import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { category, style, count, prompt, notes } = req.body || {};

    const total = Math.min(Number(count) || 10, 200);

    const aiPrompt = `
Generate ${total} ${category} design templates.
Style: ${style}
Details: ${prompt || "None"}
Notes: ${notes || "None"}

Return JSON array only.
Each item must have:
- title
- description
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: aiPrompt }],
      temperature: 0.7,
    });

    let templates = [];

    try {
      templates = JSON.parse(completion.choices[0].message.content);
    } catch {
      templates = Array.from({ length: total }, (_, i) => ({
        title: `${category} #${i + 1}`,
        description: `${style} AI generated layout`,
      }));
    }

    return res.status(200).json({ templates });
  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
