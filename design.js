
// Phase AD-3 — Content Density & Balance
// Updated logic: smarter text grouping, adaptive spacing per layout type
// No UI changes. No backend changes.

export function applyContentDensity(template, type = "default") {
  const densityMap = {
    hero: { padding: 32, blocks: 2 },
    grid: { padding: 20, blocks: 3 },
    promo: { padding: 16, blocks: 4 },
    default: { padding: 24, blocks: 3 }
  };

  const config = densityMap[type] || densityMap.default;

  template.padding = config.padding;
  template.contentBlocks = template.contentBlocks?.slice(0, config.blocks) || [];

  return template;
}
