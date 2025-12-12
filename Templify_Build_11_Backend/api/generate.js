export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { category, style, count, prompt, notes } = req.body;

    // Basic validation
    if (!category || !style || !count) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
Generate ${count} premium template ideas.

Category: ${category}
Style: ${style}
Prompt: ${prompt || ""}
Notes: ${notes || ""}

Return ONLY a valid JSON array.
`
      })
    });

    const data = await response.json();

    // Safety check
    if (!response.ok) {
      return res.status(500).json({
        error: "OpenAI API error",
        details: data
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      message: err.message
    });
  }
}
