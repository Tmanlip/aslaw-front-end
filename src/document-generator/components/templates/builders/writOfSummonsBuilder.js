import { chooseByLanguage, cleanLine } from "./utils";

export const buildWritOfSummons = (data, language = "english") => {
  const title = chooseByLanguage(language, "WRIT OF SUMMONS", "WRIT SAMAN");
  const dateLabel = chooseByLanguage(language, "Date", "Tarikh");
  const courtLine = chooseByLanguage(
    language,
    `In the ${cleanLine(data.CourtName)} at ${cleanLine(data.CourtLocation)}`,
    `Di ${cleanLine(data.CourtName)} di ${cleanLine(data.CourtLocation)}`
  );
  const caseNoLabel = chooseByLanguage(language, "Case No.", "No. Kes");
  const plaintiffLabel = chooseByLanguage(language, "Plaintiff", "Plaintif");
  const defendantLabel = chooseByLanguage(language, "Defendant", "Defendan");
  const nricLabel = chooseByLanguage(language, "NRIC/Reg No", "No. KP/Pendaftaran");
  const claimLine = chooseByLanguage(
    language,
    `The Plaintiff claims ${cleanLine(data.Currency)} ${cleanLine(data.ClaimAmount)} for ${cleanLine(data.ClaimDescription)} under contract dated ${cleanLine(data.ContractDate)}.`,
    `Plaintif menuntut sebanyak ${cleanLine(data.Currency)} ${cleanLine(data.ClaimAmount)} bagi ${cleanLine(data.ClaimDescription)} di bawah kontrak bertarikh ${cleanLine(data.ContractDate)}.`
  );
  const breachLabel = chooseByLanguage(language, "Breach Details", "Butiran Pelanggaran");
  const interestLabel = chooseByLanguage(language, "Interest Rate", "Kadar Faedah");
  const costsLabel = chooseByLanguage(language, "Costs", "Kos");
  const appearanceLine = chooseByLanguage(
    language,
    `Appearance must be entered within ${cleanLine(data.AppearanceDays)} days.`,
    `Kehadiran hendaklah difailkan dalam tempoh ${cleanLine(data.AppearanceDays)} hari.`
  );
  const hearingDateLabel = chooseByLanguage(language, "Hearing Date", "Tarikh Sebutan");
  const issuedByLabel = chooseByLanguage(language, "Issued by", "Dikeluarkan oleh");
  const solicitorLabel = chooseByLanguage(language, "Solicitor", "Peguam");
  const telLabel = chooseByLanguage(language, "Tel", "Tel");
  const emailLabel = chooseByLanguage(language, "Email", "E-mel");
  const sealRefLabel = chooseByLanguage(language, "Court Seal Ref", "Ruj. Meterai Mahkamah");

  return [
    title,
    `${dateLabel}: ${cleanLine(data.Date)}`,
    courtLine,
    `${caseNoLabel}: ${cleanLine(data.CaseNumber)}`,
    "",
    `${plaintiffLabel}:`,
    `${cleanLine(data.PlaintiffName)} (${nricLabel}: ${cleanLine(data.PlaintiffNRIC)})`,
    cleanLine(data.PlaintiffAddressLine1),
    cleanLine(data.PlaintiffAddressLine2),
    "",
    `${defendantLabel}:`,
    `${cleanLine(data.DefendantName)} (${nricLabel}: ${cleanLine(data.DefendantNRIC)})`,
    cleanLine(data.DefendantAddressLine1),
    cleanLine(data.DefendantAddressLine2),
    "",
    claimLine,
    `${breachLabel}: ${cleanLine(data.BreachDetails)}`,
    `${interestLabel}: ${cleanLine(data.InterestRate)} | ${costsLabel}: ${cleanLine(data.Currency)} ${cleanLine(data.CostsAmount)}`,
    appearanceLine,
    `${hearingDateLabel}: ${cleanLine(data.HearingDate)}`,
    "",
    `${issuedByLabel}:`,
    cleanLine(data.LawFirmName),
    cleanLine(data.LawFirmAddress),
    `${solicitorLabel}: ${cleanLine(data.LawyerName)}`,
    `${telLabel}: ${cleanLine(data.LawyerPhone)} | ${emailLabel}: ${cleanLine(data.LawyerEmail)}`,
    `${sealRefLabel}: ${cleanLine(data.CourtSealReference)}`,
  ].join("\n");
};
