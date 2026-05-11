import { chooseByLanguage, cleanLine } from "./utils";

export const buildEmergencyLeave = (data, language = "english") => {
  const subjectLabel = chooseByLanguage(language, "Subject", "Perkara");
  const subjectPrefix = chooseByLanguage(language, "Emergency Leave Request", "Permohonan Cuti Kecemasan");
  const toLabel = chooseByLanguage(language, "To", "Kepada");
  const greeting = chooseByLanguage(language, "Dear", "Tuan/Puan");
  const intro = chooseByLanguage(
    language,
    "I would like to request emergency leave with the following details:",
    "Saya ingin memohon cuti kecemasan dengan butiran berikut:"
  );
  const employeeLabel = chooseByLanguage(language, "Employee Name", "Nama Pekerja");
  const leavePeriodLabel = chooseByLanguage(language, "Leave Period", "Tempoh Cuti");
  const reasonLabel = chooseByLanguage(language, "Reason", "Sebab");
  const apology = chooseByLanguage(
    language,
    "I apologize for any inconvenience caused and appreciate your understanding.",
    "Saya memohon maaf atas sebarang kesulitan dan amat menghargai pertimbangan pihak tuan/puan."
  );
  const closing = chooseByLanguage(language, "Sincerely,", "Yang benar,");
  const toWord = chooseByLanguage(language, "to", "hingga");

  return [
    `${subjectLabel}: ${subjectPrefix} (${cleanLine(data.startDate)} ${toWord} ${cleanLine(data.endDate)})`,
    `${toLabel}: ${cleanLine(data.managerName)}`,
    "",
    `${greeting} ${cleanLine(data.managerName)},`,
    "",
    intro,
    `- ${employeeLabel}: ${cleanLine(data.senderName)}`,
    `- ${leavePeriodLabel}: ${cleanLine(data.startDate)} ${toWord} ${cleanLine(data.endDate)}`,
    `- ${reasonLabel}: ${cleanLine(data.reason)}`,
    "",
    apology,
    "",
    closing,
    cleanLine(data.senderName),
  ].join("\n");
};
