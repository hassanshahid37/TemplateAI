import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { prompt = "", count = 12 } = req.body || {};

    const systemPrompt = `
You are a professional design assistant.
Return ONLY valid JSON.
No markdown.
No explanations.
The response must be an array of template objects.
Each object must have: title, subtitle, category.
`;

    const userPrompt = `
Generate ${count} premium Canva-style templates.
Topic: ${prompt || "modern social media design"}.

Return JSON in this exact format:

[
  {
    "title": "Instagram Post #1",
    "subtitle": "Dark Premium • Modern Layout",
    "category": "Instagram"
  }
]
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });

    let raw = completion.choices[0]?.message?.content || "";

    let templates;
    try {
      templates = JSON.parse(raw);
    } catch (e) {
      // HARD FAILSAFE — UI WILL NEVER BREAK
      templates = Array.from({ length: count }).map((_, i) => ({
        title: `Instagram Post #${i + 1}`,
        subtitle: "Dark Premium • Clean Layout",
        category: "Instagram",
      }));
    }

    return res.status(200).json({
      success: true,
      templates,
    });

  } catch (error) {
    console.error("API ERROR:", error);

    // FINAL SAFETY NET
    const fallback = Array.from({ length: 12 }).map((_, i) => ({
      title: `Instagram Post #${i + 1}`,
      subtitle: "Dark Premium • Clean Layout",
      category: "Instagram",
    }));

    return res.status(200).json({
      success: true,
      warning: "OpenAI failed, fallback used",
      templates: fallback,
    });
  }
}
