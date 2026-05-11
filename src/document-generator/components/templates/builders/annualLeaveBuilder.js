import { chooseByLanguage, cleanLine } from "./utils";

export const buildAnnualLeave = (data, language = "english") => {
  const subjectLabel = chooseByLanguage(language, "Subject", "Perkara");
  const subjectPrefix = chooseByLanguage(language, "Annual Leave Request", "Permohonan Cuti Tahunan");
  const toLabel = chooseByLanguage(language, "To", "Kepada");
  const greeting = chooseByLanguage(language, "Dear", "Tuan/Puan");
  const intro = chooseByLanguage(
    language,
    "I would like to apply for annual leave with the following details:",
    "Saya ingin memohon cuti tahunan dengan butiran berikut:"
  );
  const employeeLabel = chooseByLanguage(language, "Employee Name", "Nama Pekerja");
  const leavePeriodLabel = chooseByLanguage(language, "Leave Period", "Tempoh Cuti");
  const reasonLabel = chooseByLanguage(language, "Reason", "Sebab");
  const followUp = chooseByLanguage(
    language,
    "Please let me know if any further information is needed.",
    "Mohon maklumkan sekiranya maklumat tambahan diperlukan."
  );
  const closing = chooseByLanguage(language, "Sincerely,", "Yang benar,");
  const toWord = chooseByLanguage(language, "to", "hingga");
  const naValue = chooseByLanguage(language, "N/A", "Tiada");

  return [
    `${subjectLabel}: ${subjectPrefix} (${cleanLine(data.startDate)} ${toWord} ${cleanLine(data.endDate)})`,
    `${toLabel}: ${cleanLine(data.managerName)}`,
    "",
    `${greeting} ${cleanLine(data.managerName)},`,
    "",
    intro,
    `- ${employeeLabel}: ${cleanLine(data.senderName)}`,
    `- ${leavePeriodLabel}: ${cleanLine(data.startDate)} ${toWord} ${cleanLine(data.endDate)}`,
    `- ${reasonLabel}: ${cleanLine(data.reason, naValue)}`,
    "",
    followUp,
    "",
    closing,
    cleanLine(data.senderName),
  ].join("\n");
};
