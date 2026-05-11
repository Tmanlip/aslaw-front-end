import { chooseByLanguage, cleanLine } from "./utils";

export const buildOfficialEmail = (data, language = "english") => {
  const subjectLabel = chooseByLanguage(language, "Subject", "Perkara");
  const toLabel = chooseByLanguage(language, "To", "Kepada");
  const greeting = chooseByLanguage(language, "Dear", "Tuan/Puan");
  const thanks = chooseByLanguage(language, "Thank you.", "Sekian, terima kasih.");
  const closing = chooseByLanguage(language, "Best regards,", "Yang benar,");

  return [
    `${subjectLabel}: ${cleanLine(data.subject)}`,
    `${toLabel}: ${cleanLine(data.recipientName)} (${cleanLine(data.companyName)})`,
    "",
    `${greeting} ${cleanLine(data.recipientName)},`,
    "",
    cleanLine(data.message),
    "",
    thanks,
    "",
    closing,
    cleanLine(data.senderName),
    cleanLine(data.senderTitle),
  ].join("\n");
};
