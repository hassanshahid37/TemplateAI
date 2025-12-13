// /api/generate.js
// Vercel Serverless Function (Node.js)
// Always returns templates. Uses OpenAI if available; otherwise falls back (no 500 loops).

export default async function handler(req, res) {
  // Basic CORS (safe for your single-page app)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // --- helpers ---
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const fallbackTemplates = ({ category, style, count }) => {
    const list = [];
    for (let i = 1; i <= count; i++) {
      list.push({
        title: `${category} #${i}`,
        description: `${style} • AI generated layout`,
      });
    }
    return list;
  };

  try {
    const body = req.body || {};
    const category = String(body.category || "Instagram Post");
    const style = String(body.style || "Dark Premium");
    const prompt = String(body.prompt || "");
    const count = clamp(parseInt(body.count || 24, 10) || 24, 1, 200);

    // If no key, DO NOT crash — just fallback
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(200).json({
        templates: fallbackTemplates({ category, style, count }),
        source: "fallback",
        warning: "OPENAI_API_KEY missing on server. Returned fallback templates.",
      });
    }

    // Ask OpenAI for STRICT JSON
    const sys = `You generate template ideas for a Canva-style app. Output ONLY valid JSON. No markdown.`;
    const user = `
Return JSON with this exact shape:
{"templates":[{"title":"...","description":"..."}]}

Rules:
- templates length must be exactly ${count}
- titles must start with "${category}"
- keep descriptions short (max ~12 words)
- incorporate style: "${style}"
- incorporate user prompt if helpful: "${prompt}"
`;

    // Using OpenAI Chat Completions endpoint
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });

    const raw = await resp.text();

    // If OpenAI fails (429 quota, 401 key, etc), DO NOT crash — fallback
    if (!resp.ok) {
      return res.status(200).json({
        templates: fallbackTemplates({ category, style, count }),
        source: "fallback",
        warning: `OpenAI error ${resp.status}. Returned fallback templates.`,
        details: raw?.slice?.(0, 500) || String(raw),
      });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return res.status(200).json({
        templates: fallbackTemplates({ category, style, count }),
        source: "fallback",
        warning: "OpenAI returned non-JSON. Returned fallback templates.",
        details: raw?.slice?.(0, 500) || String(raw),
      });
    }

    const content = data?.choices?.[0]?.message?.content || "";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return res.status(200).json({
        templates: fallbackTemplates({ category, style, count }),
        source: "fallback",
        warning: "Could not parse OpenAI JSON content. Returned fallback templates.",
        details: String(content).slice(0, 500),
      });
    }

    const templates = Array.isArray(parsed?.templates) ? parsed.templates : null;
    if (!templates || templates.length === 0) {
      return res.status(200).json({
        templates: fallbackTemplates({ category, style, count }),
        source: "fallback",
        warning: "OpenAI returned empty templates. Returned fallback templates.",
      });
    }

    // Ensure exact count
    const trimmed = templates.slice(0, count);
    while (trimmed.length < count) {
      trimmed.push({
        title: `${category} #${trimmed.length + 1}`,
        description: `${style} • AI generated layout`,
      });
    }

    return res.status(200).json({
      templates: trimmed,
      source: "ai",
    });
  } catch (err) {
    // FINAL safety net: never return 500 without templates
    return res.status(200).json({
      templates: [
        { title: "Instagram Post #1", description: "Dark Premium • AI generated layout" },
      ],
      source: "fallback",
      warning: "Server error occurred. Returned minimal fallback templates.",
      details: String(err?.message || err),
    });
  }
}
