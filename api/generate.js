export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { category, prompt, count = 12 } = req.body;

    if (!category || !prompt) {
      return res.status(400).json({ error: "Missing input" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "API key missing" });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You generate design templates.
Always return ONLY a JSON array.
Never return empty array.
Never add explanation.

Format:
[
  {
    "title": "Template title",
    "style": "Style name",
    "description": "Short description"
  }
]
`
          },
          {
            role: "user",
            content: `Category: ${category}. Prompt: ${prompt}. Generate ${count} items.`
          }
        ],
        temperature: 0.9
      })
    });

    const raw = await aiResponse.json();

    // 🔴 THIS IS THE FIX
    const text =
      raw?.choices?.[0]?.message?.content ??
      raw?.choices?.[0]?.text ??
      "[]";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text
      });
    }

    if (!Array.isArray(parsed)) {
      return res.status(500).json({ error: "Response is not an array" });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
