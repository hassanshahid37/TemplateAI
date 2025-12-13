import OpenAI from "openai";

export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { count = 24, category = "Instagram Post", style = "Dark Premium" } =
      req.body || {};

    const safeCount = Math.min(Math.max(Number(count) || 24, 1), 200);

    // ---------- SAFE FALLBACK (IMPORTANT) ----------
    const fallbackTemplates = Array.from({ length: safeCount }, (_, i) => ({
      title: `${category} #${i + 1}`,
      description: `${style} · AI generated layout`,
    }));

    // ---------- IF NO API KEY, RETURN FALLBACK ----------
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        templates: fallbackTemplates,
        source: "fallback-no-key",
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // ---------- AI CALL ----------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Return ONLY a JSON array of objects with title and description.",
        },
        {
          role: "user",
          content: `Generate ${safeCount} ${category} templates in ${style} style.`,
        },
      ],
      temperature: 0.7,
    });

    let templates = fallbackTemplates;

    try {
      const raw = completion.choices?.[0]?.message?.content;
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed) && parsed.length > 0) {
        templates = parsed;
      }
    } catch (e) {
      // silently fallback
    }

    return res.status(200).json({
      templates,
      source: "ai-or-fallback",
    });
  } catch (err) {
    // ---------- NEVER RETURN 500 ----------
    return res.status(200).json({
      templates: Array.from({ length: 24 }, (_, i) => ({
        title: `Template #${i + 1}`,
        description: "Safe fallback template",
      })),
      source: "error-fallback",
    });
  }
}
