import { cleanLine } from "./utils";

const firstValue = (...values) => values.find((item) => String(item ?? "").trim() !== "") || "";

export const buildWritOfSummons = (data) => {
  const value = (...fieldNames) => {
    const resolved = firstValue(...fieldNames.map((fieldName) => data[fieldName]));
    return cleanLine(resolved, "");
  };

  const courtHeading1 = value("WritCourtHeading1") || `DALAM MAHKAMAH MAJISTRET DI ${value("CourtLocation") || "SHAH ALAM"}`;
  const courtHeading2 = value("WritCourtHeading2") || "DALAM NEGERI SELANGOR DARUL EHSAN, MALAYSIA";
  const caseNoLabel = value("WritCaseNoLabel") || "GUAMAN NO:";
  const caseNumber = value("WritCaseNumber", "CaseNumber");
  const caseYear = value("WritCaseYear", "CaseYear") || "2025";

  const plaintiffName = value("PlaintiffName");
  const plaintiffNric = value("PlaintiffNRIC");

  const normalizedDefendants = Array.isArray(data.Defendants)
    ? data.Defendants
        .map((item) => ({
          name: cleanLine(item?.name || "", ""),
          nric: cleanLine(item?.nric || "", ""),
          address: cleanLine(item?.address || "", ""),
        }))
        .filter((item) => item.name || item.nric || item.address)
    : [];

  const fallbackDefendants = [
    {
      name: value("Defendant1Name", "DefendantName"),
      nric: value("Defendant1NRIC", "DefendantNRIC"),
      address: value("Defendant1Address", "DefendantAddressLine1"),
    },
    {
      name: value("Defendant2Name"),
      nric: value("Defendant2NRIC"),
      address: value("Defendant2Address", "Defendant2AddressLine1"),
    },
  ].filter((item) => item.name || item.nric || item.address);

  const defendants = normalizedDefendants.length > 0 ? normalizedDefendants : fallbackDefendants;
  const appearanceDefendants = defendants.length > 0 ? defendants : [{ name: "", nric: "", address: "" }];

  const defendantsHeadingLines = appearanceDefendants.flatMap((item, index) => [
    `${index + 1}. ${item.name || ""}`,
    `(No. K/P : ${item.nric || ""})${index === appearanceDefendants.length - 1 ? " ...DEFENDAN-DEFENDAN" : ""}`,
    "",
  ]);

  const kepadaLines = appearanceDefendants.flatMap((item, index) => [
    `${index + 1}) ${item.name || ""}`,
    item.address || "",
    "",
  ]);
  const appearanceDays = value("AppearanceDays") || "14";

  const witnessDay = value("WitnessDay");
  const witnessMonth = value("WitnessMonth");
  const witnessYear = value("WitnessYear") || "2025";
  const registrarCourt = value("RegistrarCourt", "WitnessedCourt") || "Mahkamah Majistret Shah Alam";

  const plaintiffSolicitor = value("PlaintiffSolicitor", "PlaintiffSolicitorName", "LawyerName");
  const plaintiffFirmName = value("PlaintiffFirmName", "LawFirmName") || "Tetuan Adnan Sharida & Associates";
  const plaintiffFirmAddress = value("PlaintiffFirmAddress", "LawFirmAddress");

  const generalDamagesAmount = value("GeneralDamagesAmount", "ClaimAmount") || "40,200.00";
  const specialDamagesText = value("SpecialDamagesText") || "Gantirugi Khas";
  const interestRate = value("InterestRate") || "5";

  const serviceOfficer = value("ServiceOfficer", "ServiceServerName");
  const serviceMethod = value("ServiceMethod");
  const serviceKnownBy = value("ServiceKnownBy");
  const serviceAt = value("ServiceAt", "ServiceLocation");
  const serviceOnDate = value("ServiceOnDate", "ServiceDate");
  const endorsementDate = value("EndorsementDate");
  const serverName = value("ServerName");

  const filingFirmAddress = value("FilingFirmAddress", "LawFirmAddress");
  const filingFirmTel = value("FilingFirmTel", "LawyerPhone");
  const filingFirmEmail = value("FilingFirmEmail", "LawyerEmail");
  const filingReference = value("FilingReference", "ReferenceCode");
  const signedLine = value("Signed") || (value("SignedImageDataUrl") ? "[Signature Image Attached]" : "");

  return [
    courtHeading1,
    "",
    courtHeading2,
    "",
    `${caseNoLabel} ${caseNumber} ${caseYear}`,
    "",
    "ANTARA",
    "",
    plaintiffName,
    `(No. K/P: ${plaintiffNric}) ...PLAINTIF`,
    "",
    "DAN",
    "",
    ...defendantsHeadingLines,
    "WRIT SAMAN",
    "",
    "Kepada:",
    ...kepadaLines,
    `Kami perintahkan kamu dalam tempoh empat belas (${appearanceDays}) hari selepas penyampaian writ ke atas kamu, tidak termasuk hari penyampaian itu, kamu hendaklah menyebabkan kehadiran dimasukkan untuk diri kamu dalam kausa atas guaman Plaintif yang dinamakan di atas dan ambil perhatian bahawa, jika kamu ingkar berbuat demikian, Plaintif boleh meneruskan untuk mendapatkan Penghakiman dan Pelaksanaan.`,
    "",
    `DISAKSIKAN oleh Penolong Pendaftar ${registrarCourt} pada ${witnessDay} ${witnessMonth}, ${witnessYear}`,
    "",
    "….………………….……………          ………..……………………………",
    "Peguamcara Plaintif            Penolong Pendaftar",
    plaintiffFirmName,
    "",
    "PENGINDORSAN TUNTUTAN",
    `a) Gantirugi am RM ${generalDamagesAmount}`,
    `b) ${specialDamagesText};`,
    `c) Faedah sebanyak ${interestRate}% setahun;`,
    "d) Kos tindakan;",
    "e) Apa-apa relif yang difikirkan sesuai dan adil oleh mahkamah.",
    "",
    "PENGINDORSAN TENTANG PEGUAMCARA DAN ALAMAT",
    `Writ Saman ini dikeluarkan oleh ${plaintiffFirmName} yang mempunyai alamat penyampaian di ${plaintiffFirmAddress}, peguamcara bagi Plaintif tersebut.`,
    "",
    "PENGINDORSAN BERKENAAN PENYAMPAIAN",
    `Writ Saman ini telah disampaikan oleh ${serviceOfficer} melalui ${serviceMethod} terhadap Defendan (yang saya kenali) (atau yang telah diberitahu kepada saya oleh ${serviceKnownBy}) di ${serviceAt} pada ${serviceOnDate}.`,
    `Diindorskan pada ${endorsementDate}.`,
    "",
    "………………………….",
    `Penghantar Writ Saman: ${serverName}`,
    "",
    `Writ Saman ini difailkan oleh ${plaintiffFirmName}, Peguamcara bagi Plaintif yang beralamat di ${filingFirmAddress}.`,
    `Tel : ${filingFirmTel}         Email : ${filingFirmEmail}`,
    `[Ruj.: ${filingReference}]`,
    signedLine,
    "",
    `Peguamcara Plaintif: ${plaintiffSolicitor}`,
  ].join("\n");
};
