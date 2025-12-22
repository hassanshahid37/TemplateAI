
// Nexora / Templify – Vercel Serverless API: /api/generate
// Phase AD-5 compatible: never throws, always returns 200 JSON (no 500)
// Deterministic, no external AI calls.

export default async function handler(req, res) {
  try {
    // Basic CORS / preflight safety
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(200).json({ success: true, templates: [] });
    }

    // Parse body safely (Vercel may give object or string)
    let body = {};
    try {
      body =
        req.body && typeof req.body === "object"
          ? req.body
          : JSON.parse(req.body || "{}");
    } catch {
      body = {};
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const category = typeof body.category === "string" ? body.category : "Instagram Post";
    const style = typeof body.style === "string" ? body.style : "Dark Premium";

    // Count
    let count = Number(body.count);
    if (!Number.isFinite(count)) count = 4;
    count = Math.max(1, Math.min(200, Math.floor(count)));

    // AD-5: accept divergence/fork metadata but NEVER require it
    const divergenceIndexRaw = body.divergenceIndex ?? body.forkIndex ?? body.variantIndex ?? body.i;
    let divergenceIndex = Number(divergenceIndexRaw);
    if (!Number.isFinite(divergenceIndex)) divergenceIndex = -1;

    // Build templates deterministically (fallback-safe)
    const templates = makeTemplates({ prompt, category, style, count, divergenceIndex });

    return res.status(200).json({ success: true, templates });
  } catch (err) {
    // Hard-safe: NEVER return 500
    try {
      return res.status(200).json({
        success: true,
        templates: makeTemplates({ prompt: "", category: "Instagram Post", style: "Dark Premium", count: 4, divergenceIndex: -1 }),
        error: String(err && err.message ? err.message : err),
      });
    } catch {
      return res.status(200).json({ success: true, templates: [] });
    }
  }
}

function titleCase(s) {
  return (s || "")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}


function classifyIntent(prompt, category, style){
  const p = String(prompt||"").toLowerCase();
  const has = (arr)=>arr.some(k=>p.includes(k));
  let type = "generic";
  if(has(["hiring","job","jobs","vacancy","careers","apply","join our team","recruit"])) type="hiring";
  else if(has(["sale","discount","%","off","limited","offer","deal","promo","promotion","clearance","black friday"])) type="promo";
  else if(has(["launch","announcement","announcing","introducing","event","webinar","workshop","meetup","conference"])) type="announcement";
  else if(has(["quote","motiv","inspir","mindset","success","dream","life"]) || (p.split(/\s+/).filter(Boolean).length<=6 && !has(["sale","discount","hiring","job"]))) type="quote";
  // gentle category bias
  const cat = String(category||"").toLowerCase();
  if((cat.includes("presentation") || cat.includes("resume")) && type==="promo") type="generic";
  const st = String(style||"").toLowerCase();
  if(st.includes("corporate") && type==="promo") type="generic";
  return type;
}

function pick(list, n){
  const a = Array.isArray(list)?list:[];
  if(!a.length) return "";
  const i = ((n%a.length)+a.length)%a.length;
  return a[i];
}

function makeTemplates({ prompt, category, style, count, divergenceIndex }) {
  const base = prompt ? titleCase(prompt) : "New Collection";
  const intentType = classifyIntent(prompt, category, style);

  // AD-5 archetype set (must match frontend expectations loosely)
  const archetypes = [
    { vibe: "Branding", layoutHint: "clean", cta: "Learn More" },
    { vibe: "Urgency", layoutHint: "badge-promo", cta: "Apply Now" },
    { vibe: "Info", layoutHint: "feature-grid", cta: "See Details" },
    { vibe: "CTA", layoutHint: "split-hero", cta: "Get Started" },
  ];

  // If the caller supplied a divergence index, we bias starting point,
  // but we still return 'count' templates.
  let start = 0;
  if (Number.isFinite(divergenceIndex) && divergenceIndex >= 0) {
    start = Math.floor(divergenceIndex) % archetypes.length;
  }

  const templates = [];
  for (let i = 0; i < count; i++) {
    const a0 = archetypes[(start + i) % archetypes.length];

    // deterministic CTA and vibe aligned with detected intent
    const a = { ...a0 };
    if(intentType==="promo") a.cta = pick(["Shop Now","Get % Off","Limited Offer","Buy Now"], i+start);
    else if(intentType==="hiring") a.cta = pick(["Apply Now","View Roles","Send CV","Join Our Team"], i+start);
    else if(intentType==="announcement") a.cta = pick(["Learn More","RSVP","Get Details"], i+start);
    else if(intentType==="quote") a.cta = pick(["Save","Share","Follow"], i+start);


    // Small deterministic copy tweaks to avoid 4 identical strings
    const headline = base.length > 28 ? base.slice(0, 28) : base;
    const subhead =
      intentType === "announcement"
        ? "Save the date • Don’t miss it"
        : intentType === "hiring"
        ? "Apply today • Grow with us"
        : intentType === "quote"
        ? "Save this • Share it"
        :
      a.vibe === "Info"
        ? "Clear details • Simple structure"
        : a.vibe === "Urgency"
        ? "Limited time • Act fast"
        : a.vibe === "Branding"
        ? "Premium quality • Trusted"
        : "Tap to begin • Instant results";

    templates.push({
      title: `${category} #${i + 1}`,
      description: `${style} • ${(intentType||a.vibe)} • ${a.vibe}`,
      category,
      style,
      headline,
      subhead,
      cta: a.cta,
      vibe: a.vibe,
      layoutHint: a.layoutHint,
    });
  }
  return templates;
}
