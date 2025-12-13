export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, count = 6 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt missing" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You generate clean, professional Canva-style design template descriptions.",
          },
          {
            role: "user",
            content: `Generate ${count} premium templates for: ${prompt}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "OpenAI API error",
        details: data,
      });
    }

    const text = data.choices?.[0]?.message?.content || "";

    const templates = text
      .split("\n")
      .filter((t) => t.trim().length > 0)
      .slice(0, count);

    return res.status(200).json({
      success: true,
      templates,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      message: err.message,
    });
  }
}
