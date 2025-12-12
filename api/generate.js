export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { category, style, count, prompt, notes } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          {
            role: "user",
            content: `
Generate ${count} ${category} template ideas.
Style: ${style}
Prompt: ${prompt}
Notes: ${notes || ""}

Return ONLY a valid JSON array like:
[
  { "title": "Template 1", "description": "..." }
]
`
          }
        ]
      })
    });

    const data = await response.json();

    // extract text from OpenAI
    const text = data.choices?.[0]?.message?.content || "[]";

    // parse JSON safely
    let templates;
    try {
      templates = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    return res.status(200).json(templates);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
