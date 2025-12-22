// Nexora / Templify – Serverless template intent generator
// HARD SAFE VERSION: never calls OpenAI, never throws, never returns 500.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ success: true, templates: [] });
  }

  let body = {};
  try {
    body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
  } catch {
    body = {};
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const category = typeof body.category === "string" ? body.category : "Instagram Post";
  const style = typeof body.style === "string" ? body.style : "Dark Premium";
  const count = clampInt(body.count, 4, 1, 200);

  const templates = makeFallbackTemplates({ prompt, category, style, count });

  return res.status(200).json({
    success: true,
    templates
  });
}

function clampInt(v, def, min, max) {
  const n = typeof v === "number" ? v : parseInt(v, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
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
  const p = (prompt || "").toLowerCase();
  const baseHeadline = prompt ? titleCase(prompt) : "New Collection";

  const isHiring = /(hiring|hire|job|jobs|vacancy|career|apply|staff|recruit)/.test(p);
  const isPromo = /(sale|discount|%|off|limited|offer|deal|flash|promo|promotion)/.test(p);
  const mode = isHiring ? "hiring" : (isPromo ? "promo" : "generic");

  const lenses = ["branding", "urgency", "info", "cta"];

  const map = {
    hiring: {
      branding: { vibe: "Employer Brand", layoutHint: "photo-card", subhead: "Join a team that values quality and growth.", cta: "Join Our Team" },
      urgency:  { vibe: "Urgent Hiring",  layoutHint: "big-number", subhead: "Positions open now. Limited slots available.", cta: "Apply Now" },
      info:     { vibe: "Role Details",   layoutHint: "feature-grid", subhead: "Clear roles, expectations, and benefits.", cta: "View Roles" },
      cta:      { vibe: "Apply Now",      layoutHint: "badge-promo", subhead: "Send your CV and get a quick response.", cta: "Send CV" }
    },
    promo: {
      branding: { vibe: "Brand Story",    layoutHint: "split-hero", subhead: "Premium quality with a modern look.", cta: "Explore" },
      urgency:  { vibe: "Flash Sale",     layoutHint: "big-number", subhead: "Limited time. Don’t miss this offer.", cta: "Limited Time" },
      info:     { vibe: "Feature Grid",   layoutHint: "feature-grid", subhead: "Highlights, benefits, and key details.", cta: "See Details" },
      cta:      { vibe: "Shop Now",       layoutHint: "badge-promo", subhead: "Tap to shop instantly.", cta: "Shop Now" }
    },
    generic: {
      branding: { vibe: "Clean Brand",    layoutHint: "photo-card", subhead: "Designed to look premium and modern.", cta: "Get Started" },
      urgency:  { vibe: "Bold Announcement", layoutHint: "big-number", subhead: "Make it loud. Make it clear.", cta: "Learn More" },
      info:     { vibe: "Editorial",      layoutHint: "feature-grid", subhead: "Structured, readable, and polished.", cta: "Read More" },
      cta:      { vibe: "CTA Poster",     layoutHint: "badge-promo", subhead: "One clear action, high conversion.", cta: "Start Now" }
    }
  };

  const templates = [];
  for (let i = 0; i < count; i++) {
    const lens = lenses[i % lenses.length];
    const pack = (map[mode] || map.generic)[lens] || map.generic.branding;

    templates.push({
      title: `${category} #${i + 1}`,
      subtitle: `${style} • ${pack.vibe}`,
      category,
      style,
      headline: baseHeadline,
      subhead: pack.subhead,
      cta: pack.cta,
      vibe: pack.vibe,
      creativeLens: lens,
      layoutHint: pack.layoutHint
    });
  }
  return templates;
}
 Nexora / Templify – Serverless template intent generator
// HARD SAFE VERSION: never calls OpenAI, never throws, never returns 500.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ success: true, templates: [] });
  }

  let body = {};
  try {
    body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
  } catch {
    body = {};
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const category = typeof body.category === "string" ? body.category : "Instagram Post";
  const style = typeof body.style === "string" ? body.style : "Dark Premium";
  const count = clampInt(body.count, 4, 1, 200);

  const templates = makeFallbackTemplates({ prompt, category, style, count });

  return res.status(200).json({
    success: true,
    templates
  });
}

function clampInt(v, def, min, max) {
  const n = typeof v === "number" ? v : parseInt(v, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
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
  const base = prompt ? titleCase(prompt) : "New Collection";

  const vibes = [
    "Bold Announcement",
    "Minimal Quote",
    "Split Hero",
    "Photo Card",
    "Feature Grid",
    "Editorial",
  ];

  const ctas = ["Shop Now", "Learn More", "Join Now", "Apply Today"];

  const templates = [];
  for (let i = 0; i < count; i++) {
    templates.push({
      title: `${category} #${i + 1}`,
      subtitle: `${style} • ${vibes[i % vibes.length]}`,
      category,
      style,
      headline: base,
      subhead: "Premium layout generated instantly.",
      cta: ctas[i % ctas.length],
      vibe: vibes[i % vibes.length],
      layoutHint: vibes[i % vibes.length].toLowerCase().replace(/\s+/g, "-"),
    });
  }
  return templates;
}
