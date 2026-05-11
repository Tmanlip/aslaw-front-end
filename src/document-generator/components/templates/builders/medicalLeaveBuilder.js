import { chooseByLanguage, cleanLine } from "./utils";

export const buildMedicalLeave = (data, language = "english") => {
  const subjectLabel = chooseByLanguage(language, "Subject", "Perkara");
  const subjectPrefix = chooseByLanguage(language, "Medical Leave Submission", "Penyerahan Cuti Sakit");
  const toLabel = chooseByLanguage(language, "To", "Kepada");
  const greeting = chooseByLanguage(language, "Dear", "Tuan/Puan");
  const intro = chooseByLanguage(
    language,
    "I am submitting my medical leave details below:",
    "Saya mengemukakan butiran cuti sakit saya seperti berikut:"
  );
  const employeeLabel = chooseByLanguage(language, "Employee Name", "Nama Pekerja");
  const mcDateLabel = chooseByLanguage(language, "MC Date", "Tarikh Sijil Sakit");
  const diagnosisLabel = chooseByLanguage(language, "Diagnosis/Reason", "Diagnosis/Sebab");
  const closingText = chooseByLanguage(
    language,
    "Please find my medical leave request for your review.",
    "Mohon semakan pihak tuan/puan terhadap permohonan cuti sakit ini."
  );
  const closing = chooseByLanguage(language, "Sincerely,", "Yang benar,");
  const naValue = chooseByLanguage(language, "N/A", "Tiada");

  return [
    `${subjectLabel}: ${subjectPrefix} (${cleanLine(data.mcDate)})`,
    `${toLabel}: ${cleanLine(data.managerName)}`,
    "",
    `${greeting} ${cleanLine(data.managerName)},`,
    "",
    intro,
    `- ${employeeLabel}: ${cleanLine(data.senderName)}`,
    `- ${mcDateLabel}: ${cleanLine(data.mcDate)}`,
    `- ${diagnosisLabel}: ${cleanLine(data.diagnosis, naValue)}`,
    "",
    closingText,
    "",
    closing,
    cleanLine(data.senderName),
  ].join("\n");
};
