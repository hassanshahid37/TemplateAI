export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { category, style, count, prompt } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You generate design template ideas as JSON."
          },
          {
            role: "user",
            content: `Generate ${count} ${category} templates in ${style} style. ${prompt}
Return JSON array like:
[{ "title": "...", "description": "..." }]`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    const text = data.choices?.[0]?.message?.content || "[]";
    const templates = JSON.parse(text);

    return res.status(200).json({ templates });

  } catch (err) {
    return res.status(500).json({
      error: "AI generation failed",
      details: err.message
    });
  }
}
