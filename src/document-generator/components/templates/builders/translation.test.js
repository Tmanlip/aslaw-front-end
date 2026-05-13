import { chooseByLanguage } from "./utils";
import { buildAnnualLeave } from "./annualLeaveBuilder";
import { buildWritOfSummons } from "./writOfSummonsBuilder";
import { buildInvoice } from "./invoiceBuilder";
import {
  buildMalayDeterministicTranslationPrompt,
  shouldRefineDeterministicTranslation,
} from "../../../utils/translation";

describe("document generator language selection", () => {
  test('keeps BI as English and switches Malay text only for "malay"', () => {
    expect(chooseByLanguage("english", "English", "Malay")).toBe("English");
    expect(chooseByLanguage("bi", "English", "Malay")).toBe("English");
    expect(chooseByLanguage("malay", "English", "Malay")).toBe("Malay");
  });

  test("renders Malay annual leave text when language is malay", () => {
    const output = buildAnnualLeave(
      {
        senderName: "Ali",
        managerName: "Sara",
        startDate: "1 May 2026",
        endDate: "3 May 2026",
        reason: "Keluarga",
      },
      "malay"
    );

    expect(output).toContain("Permohonan Cuti Tahunan");
    expect(output).toContain("Nama Pekerja: Ali");
    expect(output).toContain("Mohon maklumkan sekiranya maklumat tambahan diperlukan.");
    expect(output).not.toContain("Annual Leave Request");
  });

  test("renders English writ text when language is bi", () => {
    const output = buildWritOfSummons(
      {
        Date: "13 May 2026",
        CourtName: "High Court",
        CourtLocation: "Kuala Lumpur",
        CaseNumber: "A-01-1-2026",
        PlaintiffName: "Plaintiff A",
        PlaintiffNRIC: "900101-10-1234",
        PlaintiffAddressLine1: "Address 1",
        PlaintiffAddressLine2: "Address 2",
        DefendantName: "Defendant B",
        DefendantNRIC: "800202-20-4321",
        DefendantAddressLine1: "Def 1",
        DefendantAddressLine2: "Def 2",
        ClaimAmount: "1000",
        Currency: "RM",
        ClaimDescription: "services rendered",
        ContractDate: "1 Jan 2026",
        BreachDetails: "non-payment",
        InterestRate: "5%",
        CostsAmount: "200",
        LawyerName: "Lawyer L",
        LawFirmName: "Firm X",
        LawFirmAddress: "Firm Address",
        LawyerPhone: "0123456789",
        LawyerEmail: "lawyer@example.com",
        AppearanceDays: "14",
        HearingDate: "30 May 2026",
        CourtSealReference: "SEAL-1",
      },
      "bi"
    );

    expect(output).toContain("WRIT OF SUMMONS");
    expect(output).toContain("Plaintiff:");
    expect(output).not.toContain("WRIT SAMAN");
    expect(output).not.toContain("Plaintif:");
  });

  test("renders Malay invoice labels when language is malay", () => {
    const output = buildInvoice(
      {
        invoice_number: "INV-001",
        case_title: "Kes 1",
        case_id: 12,
        client_name: "Client C",
        clientID: "C-12",
        lawyerID: "L-44",
        payment_stage: "initial",
        type_of_work: "research",
        issue_date: "13 May 2026",
        due_date: "20 May 2026",
        expected_amount: "1500",
        paid_amount: "500",
        balance: "1000",
        phase_balance: "250",
        tax: "6",
        discount: "0",
        total_amount: "1500",
      },
      "malay"
    );

    expect(output).toContain("INVOIS");
    expect(output).toContain("No. Invois: INV-001");
    expect(output).toContain("Klien: Client C (C-12)");
    expect(output).not.toContain("INVOICE");
    expect(output).not.toContain("Invoice No.");
  });

  test("flags Malay leave templates for AI refinement", () => {
    expect(shouldRefineDeterministicTranslation("emergency-leave", "malay")).toBe(true);
    expect(shouldRefineDeterministicTranslation("invoice", "malay")).toBe(false);
    expect(shouldRefineDeterministicTranslation("emergency-leave", "english")).toBe(false);
  });

  test("builds a prompt that preserves structure while translating user text", () => {
    const prompt = buildMalayDeterministicTranslationPrompt(
      "Reason: I want to go to the toilet\nName: Lawyer One"
    );

    expect(prompt).toContain("Translate the following professional document into formal Malay");
    expect(prompt).toContain("Preserve the exact structure, line breaks");
    expect(prompt).toContain("Reason: I want to go to the toilet");
    expect(prompt).toContain("Name: Lawyer One");
  });
});