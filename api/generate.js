// generate.js — Layout-aware generation (Instagram Layout System v1)

import { INSTAGRAM_LAYOUTS, createTemplateContract } from "./template-contract.js";

const INSTAGRAM_LAYOUT_KEYS = Object.keys(INSTAGRAM_LAYOUTS);

function pickLayout(index) {
  return INSTAGRAM_LAYOUT_KEYS[index % INSTAGRAM_LAYOUT_KEYS.length];
}

// NOTE: Keep your existing OpenAI logic.
// This stub represents the expected shape of AI output.
async function getAIContent({ prompt, notes, style, count }) {
  return Array.from({ length: count }).map((_, i) => ({
    headline: `Headline ${i + 1}`,
    subhead: `Supporting text ${i + 1}`,
    cta: "Get Started",
    badge: i % 2 === 0 ? "New" : null
  }));
}

export async function generateTemplates({
  category,
  count,
  style,
  prompt,
  notes,
  canvas
}) {
  const results = [];
  const aiContent = await getAIContent({ prompt, notes, style, count });

  for (let i = 0; i < count; i++) {
    const layoutType = pickLayout(i);
    const content = aiContent[i];

    const contract = createTemplateContract({
      templateId: crypto.randomUUID(),
      category,
      canvas,
      layoutType,
      palette: style
    });

    results.push({
      contract,
      layoutType,
      content
    });
  }

  return results;
}
