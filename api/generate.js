export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
        messages: [
          {
            role: "system",
            content: "You generate design template ideas."
          },
          {
            role: "user",
            content: `
Create ${count} ${category} templates.
Style: ${style}
Prompt: ${prompt}
Notes: ${notes}

Return ONLY JSON like:
[
  { "title": "...", "description": "..." }
]
            `
          }
        ],
        temperature: 0.8
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;

    const templates = JSON.parse(text);

    res.status(200).json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
