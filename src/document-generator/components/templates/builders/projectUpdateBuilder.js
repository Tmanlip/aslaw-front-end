import { chooseByLanguage, cleanLine } from "./utils";

export const buildProjectUpdate = (data, language = "english") => {
  const subjectLabel = chooseByLanguage(language, "Subject", "Perkara");
  const subjectPrefix = chooseByLanguage(language, "Project Update", "Kemaskini Projek");
  const toLabel = chooseByLanguage(language, "To", "Kepada");
  const greeting = chooseByLanguage(language, "Dear", "Tuan/Puan");
  const intro = chooseByLanguage(
    language,
    `Here is the latest update for ${cleanLine(data.projectName)}.`,
    `Berikut ialah kemaskini terkini bagi ${cleanLine(data.projectName)}.`
  );
  const progressLabel = chooseByLanguage(language, "Progress Summary", "Ringkasan Kemajuan");
  const nextStepsLabel = chooseByLanguage(language, "Next Steps", "Langkah Seterusnya");
  const closing = chooseByLanguage(language, "Best regards,", "Yang benar,");

  return [
    `${subjectLabel}: ${subjectPrefix} - ${cleanLine(data.projectName)}`,
    `${toLabel}: ${cleanLine(data.recipientName)}`,
    "",
    `${greeting} ${cleanLine(data.recipientName)},`,
    "",
    intro,
    "",
    `${progressLabel}:`,
    cleanLine(data.progress),
    "",
    `${nextStepsLabel}:`,
    cleanLine(data.nextSteps),
    "",
    closing,
    cleanLine(data.senderName),
  ].join("\n");
};
