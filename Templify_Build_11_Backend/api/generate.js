export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { category, style, count, prompt, notes } = req.body;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5",
      input: `
Generate ${count} premium template ideas.
Category: ${category}
Style: ${style}
Prompt: ${prompt}
Notes: ${notes || ""}
Return ONLY valid JSON array.
`
    })
  });

  const data = await response.json();
  return res.status(200).json(data);
}
