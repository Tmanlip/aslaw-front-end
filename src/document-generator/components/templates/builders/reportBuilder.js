import { chooseByLanguage, cleanLine } from "./utils";

export const buildReport = (data, language = "english") => {
  const reportTitleLabel = chooseByLanguage(language, "Report Title", "Tajuk Laporan");
  const dateLabel = chooseByLanguage(language, "Date", "Tarikh");
  const preparedByLabel = chooseByLanguage(language, "Prepared By", "Disediakan Oleh");
  const objectiveLabel = chooseByLanguage(language, "Objective", "Objektif");
  const findingsLabel = chooseByLanguage(language, "Findings", "Dapatan");
  const recommendationsLabel = chooseByLanguage(language, "Recommendations", "Cadangan");
  const conclusionLabel = chooseByLanguage(language, "Conclusion", "Kesimpulan");

  return [
    `${reportTitleLabel}: ${cleanLine(data.reportTitle)}`,
    `${dateLabel}: ${cleanLine(data.date)}`,
    `${preparedByLabel}: ${cleanLine(data.preparedBy)}`,
    "",
    `${objectiveLabel}:`,
    cleanLine(data.objective),
    "",
    `${findingsLabel}:`,
    cleanLine(data.findings),
    "",
    `${recommendationsLabel}:`,
    cleanLine(data.recommendations),
    "",
    `${conclusionLabel}:`,
    cleanLine(data.conclusion),
  ].join("\n");
};
