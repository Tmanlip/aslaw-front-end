const MALAY_AI_REFINED_TEMPLATE_IDS = new Set([
  "official-email",
  "emergency-leave",
  "annual-leave",
  "medical-leave",
  "meeting-minutes",
  "project-update",
  "report",
]);

export const shouldRefineDeterministicTranslation = (templateId, language) => {
  return language === "malay" && MALAY_AI_REFINED_TEMPLATE_IDS.has(templateId);
};

export const buildMalayDeterministicTranslationPrompt = (documentText) => {
  return [
    "Translate the following professional document into formal Malay (Bahasa Melayu).",
    "Preserve the exact structure, line breaks, bullet markers, dates, names, phone numbers, email addresses, identifiers, and proper nouns unless they should clearly remain unchanged.",
    "Translate descriptive user-entered content such as reasons, findings, messages, and narrative sentences into natural formal Malay.",
    "Return only the translated document text.",
    "",
    "Document:",
    documentText,
  ].join("\n");
};