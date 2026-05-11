import { chooseByLanguage, cleanLine } from "./utils";

export const buildInvoice = (data, language = "english") => {
  const heading = chooseByLanguage(language, "INVOICE", "INVOIS");
  const invoiceNumberLabel = chooseByLanguage(language, "Invoice No.", "No. Invois");
  const caseLabel = chooseByLanguage(language, "Case", "Kes");
  const clientLabel = chooseByLanguage(language, "Client", "Klien");
  const lawyerLabel = chooseByLanguage(language, "Lawyer", "Peguam");
  const stageLabel = chooseByLanguage(language, "Payment Stage", "Peringkat Bayaran");
  const typeOfWorkLabel = chooseByLanguage(language, "Type of Work", "Jenis Kerja");
  const issueDateLabel = chooseByLanguage(language, "Issue Date", "Tarikh Dikeluarkan");
  const dueDateLabel = chooseByLanguage(language, "Due Date", "Tarikh Akhir");
  const expectedLabel = chooseByLanguage(language, "Expected Amount", "Jumlah Dijangka");
  const paidLabel = chooseByLanguage(language, "Paid Amount", "Jumlah Dibayar");
  const typeOfWorkBalanceLabel = chooseByLanguage(language, "Type of Work Balance", "Baki Jenis Kerja");
  const phaseBalanceLabel = chooseByLanguage(language, "Phase Balance", "Baki Fasa");
  const taxLabel = chooseByLanguage(language, "Tax", "Cukai");
  const discountLabel = chooseByLanguage(language, "Discount", "Diskaun");
  const totalLabel = chooseByLanguage(language, "Total Amount", "Jumlah Keseluruhan");

  const resolveField = (name) => {
    if (data == null) return undefined;
    if (Object.prototype.hasOwnProperty.call(data, name)) return data[name];
    // snake_case -> camelCase
    const camel = name.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (Object.prototype.hasOwnProperty.call(data, camel)) return data[camel];
    // camelCase -> PascalCase (ClientName, RecipientName) to support LOD-style prefill
    const pascal = camel.charAt(0).toUpperCase() + camel.slice(1);
    if (Object.prototype.hasOwnProperty.call(data, pascal)) return data[pascal];
    if (data.case_data) {
      if (Object.prototype.hasOwnProperty.call(data.case_data, name)) return data.case_data[name];
      if (Object.prototype.hasOwnProperty.call(data.case_data, camel)) return data.case_data[camel];
    }
    return undefined;
  };

  const value = (fieldName) => cleanLine(resolveField(fieldName), "N/A");

  const firstValue = (fieldNames) => {
    for (const n of fieldNames) {
      const v = resolveField(n);
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    }
    return undefined;
  };

  const clientDisplayName = cleanLine(
    firstValue(["client_name", "ClientName", "RecipientName", "recipientName", "case_data.clientName", "case_data.client_name"]),
    "N/A"
  );

  const clientDisplayId = cleanLine(firstValue(["clientID", "clientId", "RecipientCompanyName"]), "N/A");

  return [
    heading,
    "",
    `${invoiceNumberLabel}: ${value("invoice_number")}`,
    `${caseLabel}: ${value("case_title")} (${value("case_id")})`,
    `${clientLabel}: ${clientDisplayName} (${clientDisplayId})`,
    `${lawyerLabel}: ${cleanLine(firstValue(["lawyerID", "lawyerId"]), "N/A")}`,
    `${stageLabel}: ${value("payment_stage")}`,
    `${typeOfWorkLabel}: ${value("type_of_work")}`,
    `${issueDateLabel}: ${value("issue_date")}`,
    `${dueDateLabel}: ${value("due_date")}`,
    "",
    `${expectedLabel}: ${value("expected_amount")}`,
    `${paidLabel}: ${value("paid_amount")}`,
    `${typeOfWorkBalanceLabel}: ${value("balance")}`,
    `${phaseBalanceLabel}: ${value("phase_balance")}`,
    `${taxLabel}: ${value("tax")}`,
    `${discountLabel}: ${value("discount")}`,
    `${totalLabel}: ${value("total_amount")}`,
  ].join("\n");
};