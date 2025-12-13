export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { category, prompt, count = 12 } = req.body;

    // Basic validation
    if (!category || !prompt) {
      return res.status(400).json({ error: "Missing category or prompt" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }

    // 🔹 CLEAR + RELAXED PROMPT (IMPORTANT)
    const systemPrompt = `
You are a professional design assistant.

Generate ${count} premium ${category} template ideas.

Rules:
- Return a JSON array
- Each item must be an object
- Do NOT return empty array
- Do NOT include explanations or markdown
- Be creative even if unsure

JSON format example:
[
  {
    "title": "Dark Luxury Real Estate Post",
    "style": "Dark Premium",
    "description": "Bold typography with modern layout"
  }
]
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.9
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "Invalid AI response" });
    }

    const text = data.choices[0].message.content || "[]";

    let templates;
    try {
      templates = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text
      });
    }

    // Ensure array
    if (!Array.isArray(templates)) {
      return res.status(500).json({ error: "AI did not return an array" });
    }

    return res.status(200).json(templates);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
