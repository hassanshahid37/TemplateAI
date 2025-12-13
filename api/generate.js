export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { count = 24, category = "Instagram Post", style = "Dark Premium" } = req.body || {};

    // SAFE fallback templates (frontend already understands this)
    const templates = Array.from({ length: Number(count) }, (_, i) => ({
      title: `${category} #${i + 1}`,
      description: `${style} • AI generated layout`
    }));

    return res.status(200).json({
      templates
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server failed",
      details: String(err)
    });
  }
}
