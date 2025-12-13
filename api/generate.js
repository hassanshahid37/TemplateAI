export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { count = 24, category = "Instagram Post", style = "Dark Premium" } = req.body || {};

    const templates = Array.from({ length: Number(count) || 24 }).map((_, i) => ({
      title: `${category} #${i + 1}`,
      description: `${style} • AI generated layout`
    }));

    return res.status(200).json({
      templates
    });
  } catch (err) {
    return res.status(500).json({
      error: "Generate failed",
      details: err.message
    });
  }
}
