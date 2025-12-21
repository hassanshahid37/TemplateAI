// api/generate.js
// Nexora / Templify – Serverless template intent generator
// Rule: NEVER break UI. NEVER return 500 for generation. Always return {success:true, templates:[...]}.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Parse body safely
  let body = {};
  try {
    body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
  } catch {
    body = {};
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const category = typeof body.category === "string" ? body.category : "Instagram Post";
  const style = typeof body.style === "string" ? body.style : "Dark Premium";
  const mode = typeof body.mode === "string" ? body.mode : "full";
  const count = clampInt(body.count, 24, 1, 200);

  // Copy/enrichment calls should NEVER block or error the UI.
  // If frontend triggers copy mode, we simply acknowledge.
  if (mode === "copy") {
    return res.status(200).json({ success: true, templates: [] });
  }

  // Fast fallback templates (always available)
  const fallback = makeFallbackTemplates({ prompt, category, style, count });

  const apiKey = process.env.OPENAI_API_KEY;

  // No key => return fallback immediately (fast, stable)
  if (!apiKey) {
    return res.status(200).json({ success: true, templates: fallback });
  }

  // With key => try AI once; if it fails or is slow, return fallback (no 500)
  try {
    const templates = await withTimeout(
      generateWithOpenAI({ apiKey, prompt, category, style, count }),
      8500
    );

    if (Array.isArray(templates) && templates.length) {
      return res.status(200).json({ success: true, templates: templates.slice(0, count) });
    }
  } catch {
    // silent fallback
  }

  return res.status(200).json({ success: true, templates: fallback });
}

/* ---------------- helpers ---------------- */

function clampInt(v, def, min, max) {
  const n = typeof v === "number" ? v : parseInt(v, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    Promise.resolve(promise)
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

function seededPick(arr, seed) {
  if (!arr.length) return "";
  const x = Math.abs(hashCode(seed)) % arr.length;
  return arr[x];
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function titleCase(s) {
  return (s || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function makeFallbackTemplates({ prompt, category, style, count }) {
  const p = (prompt || "").trim();
  const base = p ? titleCase(p) : "New Collection";

  const vibes = [
    "Bold Announcement",
    "Minimal Quote",
    "Split Hero",
    "Photo Card",
    "Feature Grid",
    "Editorial",
    "Modern Banner",
    "Clean Promo",
    "Vibrant Sale",
    "Soft Gradient",
    "Neon Accent",
    "Glass Overlay",
  ];

  const ctas = ["Shop Now", "Learn More", "Join Now", "Apply Today", "Get Started", "Explore"];

  const subs = [
    "Premium design with clear hierarchy.",
    "High-contrast, clean layout.",
    "Modern typography and spacing.",
    "Editorial layout with strong headline.",
    "Minimalist composition with punch.",
  ];

  const templates = [];
  for (let i = 0; i < count; i++) {
    const vibe = vibes[i % vibes.length];
    const cta = seededPick(ctas, `${p}|${style}|${i}`);
    const sub = seededPick(subs, `${category}|${i}|${p}`);

    templates.push({
      title: `${category} #${i + 1}`,
      subtitle: `${style} • ${vibe}`,
      category,
      style,
      headline: base,
      subhead: sub,
      cta,
      // Hints consumed by design.js (safe to ignore if not used)
      vibe,
      layoutHint: vibe.toLowerCase().replace(/\s+/g, "-"),
      seed: `${hashCode(`${p}|${category}|${style}|${i}`)}`,
    });
  }
  return templates;
}

async function generateWithOpenAI({ apiKey, prompt, category, style, count }) {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey });

  const system =
    "You are a premium template intent generator. Respond ONLY with valid JSON. No markdown, no extra text.";

  const user = [
    `Generate ${count} premium ${category} template intents for the prompt: "${prompt || "general"}".`,
    `Style: ${style}.`,
    "Return STRICT JSON in this shape:",
    "{",
    '  "templates": [',
    "    {",
    '      "title": "Instagram Post #1",',
    '      "subtitle": "Dark Premium • Bold Announcement",',
    '      "category": "Instagram Post",',
    '      "style": "Dark Premium",',
    '      "headline": "Short headline",',
    '      "subhead": "One sentence supporting line",',
    '      "cta": "Shop Now",',
    '      "vibe": "Bold Announcement",',
    '      "layoutHint": "split-hero"',
    "    }",
    "  ]",
    "}",
    "Rules: keep copy short, avoid profanity, do not include any URLs, and keep fields as plain strings.",
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const text = completion?.choices?.[0]?.message?.content || "";
  const data = extractJson(text);
  const arr = data && Array.isArray(data.templates) ? data.templates : null;
  if (!arr) return null;

  // Normalize & harden
  const cleaned = arr
    .filter((t) => t && typeof t === "object")
    .map((t, idx) => ({
      title: String(t.title || `${category} #${idx + 1}`),
      subtitle: String(t.subtitle || `${style} • Premium`),
      category: String(t.category || category),
      style: String(t.style || style),
      headline: String(t.headline || ""),
      subhead: String(t.subhead || ""),
      cta: String(t.cta || ""),
      vibe: String(t.vibe || ""),
      layoutHint: String(t.layoutHint || ""),
    }));

  return cleaned;
}

function extractJson(text) {
  if (!text || typeof text !== "string") return null;

  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // Try to find the first JSON object in the text
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }
  return null;
}
