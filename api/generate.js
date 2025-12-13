import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { category, style, count, prompt } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You generate design template titles and short descriptions."
        },
        {
          role: "user",
          content: `Generate ${count} ${category} templates in ${style} style. ${prompt}`
        }
      ],
      temperature: 0.7,
    });

    const lines = response.choices[0].message.content
      .split("\n")
      .filter(Boolean);

    const templates = lines.map((text, i) => ({
      title: `${category} #${i + 1}`,
      description: text
    }));

    return res.status(200).json({ templates });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
