import React from "react";

const chooseByLanguage = (language, english, malay) => (language === "malay" ? malay : english);

const normalizeValue = (value) => {
  if (value === undefined || value === null) {
    return "-";
  }

  const text = String(value).trim();
  return text ? text : "-";
};

const InvoicePreview = ({ data = {}, language = "english" }) => {
  const rows = [
    [chooseByLanguage(language, "Invoice Number", "No. Invois"), data.invoice_number],
    [chooseByLanguage(language, "Case Title", "Tajuk Kes"), data.case_title],
    [chooseByLanguage(language, "Case ID", "ID Kes"), data.case_id],
    [chooseByLanguage(language, "Client Name", "Nama Klien"), data.client_name],
    [chooseByLanguage(language, "Client ID", "ID Klien"), data.clientID],
    [chooseByLanguage(language, "Lawyer ID", "ID Peguam"), data.lawyerID],
    [chooseByLanguage(language, "Payment Stage", "Peringkat Bayaran"), data.payment_stage],
    [chooseByLanguage(language, "Type of Work", "Jenis Kerja"), data.type_of_work],
    [chooseByLanguage(language, "Issue Date", "Tarikh Dikeluarkan"), data.issue_date],
    [chooseByLanguage(language, "Due Date", "Tarikh Akhir"), data.due_date],
    [chooseByLanguage(language, "Bank Name", "Nama Bank"), data.bank_name],
    [chooseByLanguage(language, "Account No.", "No. Akaun"), data.bank_account_no],
    [chooseByLanguage(language, "Expected Amount", "Jumlah Dijangka"), data.expected_amount],
    [chooseByLanguage(language, "Paid Amount", "Jumlah Dibayar"), data.paid_amount],
    [chooseByLanguage(language, "Type of Work Balance", "Baki Jenis Kerja"), data.balance],
    [chooseByLanguage(language, "Phase Balance", "Baki Fasa"), data.phase_balance],
    [chooseByLanguage(language, "Tax (%)", "Cukai (%)"), data.tax],
    [chooseByLanguage(language, "Discount (%)", "Diskaun (%)"), data.discount],
    [chooseByLanguage(language, "Total Amount", "Jumlah Keseluruhan"), data.total_amount],
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          border: "1px solid #dbe6df",
          borderRadius: 8,
        }}
      >
        <thead>
          <tr style={{ background: "#f5faf7" }}>
            <th style={{ textAlign: "left", padding: "0.65rem", borderBottom: "1px solid #dbe6df", width: "36%", whiteSpace: "nowrap" }}>
              {chooseByLanguage(language, "Field", "Medan")}
            </th>
            <th style={{ textAlign: "left", padding: "0.65rem", borderBottom: "1px solid #dbe6df", whiteSpace: "nowrap" }}>
              {chooseByLanguage(language, "Value", "Nilai")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={String(label)}>
              <td style={{ padding: "0.6rem 0.65rem", borderBottom: "1px solid #eef3ef", fontWeight: 600, whiteSpace: "nowrap" }}>
                {label}
              </td>
              <td style={{ padding: "0.6rem 0.65rem", borderBottom: "1px solid #eef3ef", whiteSpace: "nowrap" }}>
                {normalizeValue(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoicePreview;
