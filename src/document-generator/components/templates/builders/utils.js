export const splitListInput = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const cleanLine = (value, fallback = "N/A") => {
  // Preserve numeric 0, empty strings after conversion, and other falsy values
  if (value === 0 || value === "0") {
    return "0";
  }
  if (!value && value !== 0) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

export const chooseByLanguage = (language, englishText, malayText) => {
  return language === "malay" ? malayText : englishText;
};

export const formatNumberedList = (items) => {
  if (items.length === 0) {
    return "1. N/A";
  }

  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
};

export const formatBulletedList = (items) => {
  if (items.length === 0) {
    return "- N/A";
  }

  return items.map((item) => `- ${item}`).join("\n");
};
