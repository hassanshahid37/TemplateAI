const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, count, category } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You generate premium design template ideas.",
          },
          {
            role: "user",
            content: `Generate ${count} ${category} template ideas. Prompt: ${prompt}`,
          },
        ],
        temperature: 0.8,
      }),
    });

    const data = await response.json();

    res.status(200).json({
      templates: data.choices[0].message.content.split("\n"),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
