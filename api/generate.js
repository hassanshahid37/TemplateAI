export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { category, style, count, prompt, notes } = req.body || {};

    const items = [];
    const total = Math.min(Number(count) || 10, 200);

    for (let i = 1; i <= total; i++) {
      items.push({
        title: `${category || "Template"} #${i}`,
        description: `${style || "Premium"} • AI generated layout`
      });
    }

    return res.status(200).json({
      templates: items
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}
