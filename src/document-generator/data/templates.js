export const templates = [
  {
    id: "official-email",
    category: "documents",
    title: "Official Email",
    description: "Professional email for business correspondence.",
    fields: [
      { name: "recipientName", label: "Recipient Name", type: "text" },
      { name: "companyName", label: "Company Name", type: "text" },
      { name: "subject", label: "Subject", type: "text" },
      { name: "message", label: "Message Body", type: "textarea" },
      { name: "senderName", label: "Your Name", type: "text" },
      { name: "senderTitle", label: "Your Job Title", type: "text" },
    ],
    generate: (data) => `Write a professional email with the following details:

Recipient: ${data.recipientName}
Company: ${data.companyName}
Subject: ${data.subject}
Message: ${data.message}
Sender: ${data.senderName}, ${data.senderTitle}`,
  },

  {
    id: "emergency-leave",
    category: "documents",
    title: "Emergency Leave Request",
    description: "Formal emergency leave email.",
    fields: [
      { name: "managerName", label: "Manager Name", type: "text" },
      { name: "startDate", label: "Start Date", type: "date" },
      { name: "endDate", label: "End Date", type: "date" },
      { name: "reason", label: "Reason", type: "textarea" },
      { name: "senderName", label: "Your Name", type: "text" },
    ],
    generate: (data) => `Write a formal emergency leave email:

Manager: ${data.managerName}
From: ${data.senderName}
Leave period: ${data.startDate} to ${data.endDate}
Reason: ${data.reason}`,
  },

  {
    id: "annual-leave",
    category: "documents",
    title: "Annual Leave Request",
    description: "Formal request for planned annual leave.",
    fields: [
      { name: "managerName", label: "Manager Name", type: "text" },
      { name: "startDate", label: "Start Date", type: "date" },
      { name: "endDate", label: "End Date", type: "date" },
      { name: "reason", label: "Reason (Optional)", type: "textarea" },
      { name: "senderName", label: "Your Name", type: "text" },
    ],
    generate: (data) => `Write a formal annual leave request email:

Manager: ${data.managerName}
From: ${data.senderName}
Leave period: ${data.startDate} to ${data.endDate}
Reason: ${data.reason || "N/A"}`,
  },

  {
    id: "medical-leave",
    category: "documents",
    title: "Medical Leave Submission",
    description: "Email to submit a medical certificate and request leave.",
    fields: [
      { name: "managerName", label: "Manager Name", type: "text" },
      { name: "mcDate", label: "Date of MC", type: "date" },
      {
        name: "diagnosis",
        label: "Diagnosis / Reason (Optional)",
        type: "text",
      },
      { name: "senderName", label: "Your Name", type: "text" },
    ],
    generate: (data) => `Write a medical leave email:

Manager: ${data.managerName}
From: ${data.senderName}
MC Date: ${data.mcDate}
Diagnosis / Reason: ${data.diagnosis || "N/A"}`,
  },

  {
    id: "meeting-minutes",
    category: "reports",
    title: "Meeting Minutes",
    description: "Record notes and decisions from a meeting.",
    fields: [
      { name: "meetingTitle", label: "Meeting Title", type: "text" },
      { name: "date", label: "Date", type: "date" },
      { name: "attendees", label: "Attendees", type: "textarea" },
      { name: "agenda", label: "Agenda Items", type: "textarea" },
      { name: "decisions", label: "Key Decisions", type: "textarea" },
      { name: "actionItems", label: "Action Items", type: "textarea" },
    ],
    generate: (data) => `Write meeting minutes:

Meeting: ${data.meetingTitle}
Date: ${data.date}
Attendees: ${data.attendees}
Agenda: ${data.agenda}
Decisions: ${data.decisions}
Action Items: ${data.actionItems}`,
  },

  {
    id: "project-update",
    category: "reports",
    title: "Project Update",
    description: "Send a quick update on project progress.",
    fields: [
      { name: "recipientName", label: "Recipient Name", type: "text" },
      { name: "projectName", label: "Project Name", type: "text" },
      { name: "progress", label: "Progress Summary", type: "textarea" },
      { name: "nextSteps", label: "Next Steps", type: "textarea" },
      { name: "senderName", label: "Your Name", type: "text" },
    ],
    generate: (data) => `Write a project update email:

To: ${data.recipientName}
Project: ${data.projectName}
Progress: ${data.progress}
Next Steps: ${data.nextSteps}
From: ${data.senderName}`,
  },

  {
    id: "formal-letter",
    category: "documents",
    title: "Letter of Demand (LOD)",
    description: "Populate all LOD DOCX variables for demand letter generation.",
    fields: [
      {
        name: "DeliveryByRegisteredPost",
        label: "DeliveryByRegisteredPost",
        type: "checkbox",
        defaultValue: true,
        required: false,
      },
      {
        name: "DeliveryByHand",
        label: "DeliveryByHand",
        type: "checkbox",
        defaultValue: false,
        required: false,
      },
      {
        name: "DeliveryByOrdinaryPost",
        label: "DeliveryByOrdinaryPost",
        type: "checkbox",
        defaultValue: false,
        required: false,
      },
      {
        name: "DeliveryByWhatsAppEmail",
        label: "DeliveryByWhatsAppEmail",
        type: "checkbox",
        defaultValue: true,
        required: false,
      },
      {
        name: "DeliveryByCourier",
        label: "DeliveryByCourier",
        type: "checkbox",
        defaultValue: false,
        required: false,
      },
      {
        name: "DeliveryByARRegisteredPost",
        label: "DeliveryByARRegisteredPost",
        type: "checkbox",
        defaultValue: false,
        required: false,
      },
      { name: "Date", label: "Date", type: "date" },
      { name: "YourCompanyName", label: "YourCompanyName", type: "text" },
      { name: "RecipientName", label: "RecipientName", type: "text" },
      {
        name: "RecipientCompanyName",
        label: "RecipientCompanyName",
        type: "text",
      },
      {
        name: "RecipientAddressLine1",
        label: "RecipientAddressLine1",
        type: "text",
      },
      {
        name: "RecipientAddressLine2",
        label: "RecipientAddressLine2",
        type: "text",
      },
      { name: "ClientName", label: "ClientName", type: "text" },
      {
        name: "ClientServiceAddress",
        label: "ClientServiceAddress",
        type: "textarea",
      },
      {
        name: "BackgroundFacts",
        label: "BackgroundFacts",
        type: "textarea",
        required: false,
      },
      {
        name: "DefamationActs",
        label: "DefamationActs",
        type: "textarea",
        required: false,
      },
      {
        name: "DefamatoryStatementsDetails",
        label: "DefamatoryStatementsDetails",
        type: "textarea",
        required: false,
      },
      {
        name: "ImageUploadDetails",
        label: "ImageUploadDetails",
        type: "textarea",
        required: false,
      },
      {
        name: "AdditionalPublicationDetails",
        label: "AdditionalPublicationDetails",
        type: "textarea",
        required: false,
      },
      {
        name: "ReshareDetails",
        label: "ReshareDetails",
        type: "textarea",
        required: false,
      },
      {
        name: "CaseDescription",
        label: "CaseDescription",
        type: "textarea",
        required: false,
      },
      {
        name: "MainSocialAccount",
        label: "MainSocialAccount",
        type: "text",
      },
      { name: "Reference", label: "Reference", type: "text" },
      { name: "Currency", label: "Currency", type: "text" },
      { name: "AmountDue", label: "AmountDue", type: "text" },
      { name: "GoodsOrServices", label: "GoodsOrServices", type: "textarea" },
      {
        name: "PaymentWindowDays",
        label: "PaymentWindowDays",
        type: "number",
      },
      {
        name: "PaymentInstructions",
        label: "PaymentInstructions",
        type: "textarea",
      },
      { name: "RemittanceEmail", label: "RemittanceEmail", type: "text" },
      { name: "ContactPhone", label: "ContactPhone", type: "text" },
      { name: "ContactEmail", label: "ContactEmail", type: "text" },
      { name: "YourSignerName", label: "YourSignerName", type: "text" },
      { name: "YourSignerTitle", label: "YourSignerTitle", type: "text" },
      {
        name: "SignedImageDataUrl",
        label: "Signed (Image)",
        type: "file",
        accept: "image/png,image/jpeg,image/jpg",
        required: false,
      },
      { name: "LegalClient", label: "LegalClient", type: "text", required: false },
    ],
    generate: (data) => `Prepare a Letter of Demand using these variables:

Date: ${data.Date}
YourCompanyName: ${data.YourCompanyName}
RecipientName: ${data.RecipientName}
Reference: ${data.Reference}
Currency: ${data.Currency}
AmountDue: ${data.AmountDue}
GoodsOrServices: ${data.GoodsOrServices}
PaymentWindowDays: ${data.PaymentWindowDays}
YourSignerName: ${data.YourSignerName}
YourSignerTitle: ${data.YourSignerTitle}`,
  },

  {
    id: "writ-of-summons",
    category: "documents",
    title: "Writ of Summons",
    description: "Generate a Writ of Summons DOCX using Malay writ variables.",
    fields: [
      { name: "Date", label: "Date", type: "date" },
      { name: "WritCaseNumber", label: "Case Number (Auto-filled)", type: "text", required: false, readOnly: true },
      { name: "CaseNoReference", label: "Case No Reference", type: "text", required: false, readOnly: true },
      { name: "WritCaseYear", label: "Case Year", type: "text", defaultValue: "2025" },
      { name: "CaseYear", label: "Case Year (Template Alias)", type: "text", required: false, readOnly: true },
      { name: "PlaintiffName", label: "Plaintiff Name", type: "text" },
      { name: "PlaintiffNRIC", label: "Plaintiff NRIC", type: "text" },
      { name: "Defendants", label: "Defendants", type: "defendants", required: false },
      { name: "Place", label: "Place", type: "text", required: false },
      { name: "CourtPlace2", label: "Court Place 2", type: "text", required: false },
      { name: "RegistrarCourt", label: "Registrar Court", type: "text", required: false },
      { name: "AppearanceDays", label: "Appearance Days", type: "number", defaultValue: 14, required: false },
      { name: "AppearanceDaysWord", label: "Appearance Days (Word)", type: "text", required: false, readOnly: true },
      { name: "WitnessDay", label: "Witness Day", type: "text" },
      { name: "WitnessMonth", label: "Witness Month", type: "text" },
      { name: "WitnessYear", label: "Witness Year", type: "text", required: false },
      { name: "PlaintiffSolicitor", label: "Plaintiff Solicitor", type: "text" },
      { name: "LawyerName", label: "Lawyer Name", type: "text", required: false, readOnly: true },
      { name: "OpponentLawyer", label: "Opponent Lawyer", type: "text", required: false },
      { name: "PlaintiffFirmName", label: "Plaintiff Firm Name", type: "text" },
      { name: "PlaintiffFirmAddress", label: "Plaintiff Firm Address", type: "textarea" },
      { name: "FirmAddress", label: "Firm Address", type: "textarea", required: false, readOnly: true },
      { name: "DamagesAmount", label: "Damages Amount", type: "text", required: false },
      { name: "SDamagesText", label: "Special Damages Text", type: "text", required: false },
      { name: "InterestRate", label: "Interest Rate", type: "text", required: false },
      { name: "InterestFromText", label: "Interest From Text", type: "text", required: false },
      { name: "CostsActionText", label: "Costs Action Text", type: "text", required: false },
      { name: "OtherReliefText", label: "Other Relief Text", type: "text", required: false },
      { name: "InitialCostsAmount", label: "Initial Costs Amount", type: "text", required: false },
      { name: "SubstitutedServiceCostsAmount", label: "Substituted Service Costs Amount", type: "text", required: false },
      { name: "PostagePrice", label: "Postage Price", type: "text", required: false },
      { name: "ServiceOfficer", label: "Service Officer", type: "text" },
      { name: "ServiceMethod", label: "Service Method", type: "text" },
      { name: "ServiceKnownBy", label: "Service Known By", type: "text" },
      { name: "ServiceAt", label: "Service At", type: "text" },
      { name: "ServiceOnDate", label: "Service On Date", type: "text" },
      { name: "EndorsementDate", label: "Endorsement Date (Auto-filled from Date)", type: "text", required: false, readOnly: true },
      { name: "ServerName", label: "Server Name", type: "text" },
      { name: "FilingFirmAddress", label: "Filing Firm Address (Auto-filled)", type: "textarea", required: false, readOnly: true },
      { name: "FilingFirmTel", label: "Filing Firm Tel", type: "text" },
      { name: "FilingFirmEmail", label: "Filing Firm Email", type: "text" },
      { name: "FilingReference", label: "Filing Reference", type: "text" },
      {
        name: "SignedImageDataUrl",
        label: "Signed (Image)",
        type: "file",
        accept: "image/png,image/jpeg,image/jpg",
        required: false,
      },
      { name: "Signed", label: "Signed (Text Fallback)", type: "text", required: false },
    ],
    generate: (data) => `Prepare a Writ of Summons using these variables:

Court Heading 1: ${data.WritCourtHeading1}
Case Number: ${data.WritCaseNumber}
Case Year: ${data.WritCaseYear}
PlaintiffName: ${data.PlaintiffName}
Defendants: ${(Array.isArray(data.Defendants) ? data.Defendants : []).map((d) => d?.name).filter(Boolean).join(", ")}
Plaintiff Firm Name: ${data.PlaintiffFirmName}
Filing Reference: ${data.FilingReference}`,
  },

  {
    id: "invoice",
    category: "invoices",
    icon: "Clipboard",
    title: "Invoice",
    description: "Generate invoice documents with case and payment phase details.",
    fields: [
      { name: "invoice_number", label: "Invoice Number", type: "text" },
      { name: "case_id", label: "Case Number", type: "text" },
      { name: "case_title", label: "Case Title", type: "text" },
      { name: "clientID", label: "Client ID", type: "text" },
      { name: "lawyerID", label: "Lawyer ID", type: "text" },
      { name: "client_name", label: "Client Name", type: "text" },
      {
        name: "payment_stage",
        label: "Payment Stage",
        type: "select",
        defaultValue: "initial",
        options: [
          { value: "initial", label: "Initial" },
          { value: "first", label: "First" },
          { value: "second", label: "Second" },
          { value: "third", label: "Third" },
          { value: "final", label: "Final" },
        ],
      },
      {
        name: "type_of_work",
        label: "Type of Work",
        type: "select",
        required: false,
        options: [],
      },
      { name: "issue_date", label: "Issue Date", type: "date" },
      { name: "due_date", label: "Due Date", type: "date" },
      { name: "expected_amount", label: "Expected Amount", type: "number" },
      { name: "paid_amount", label: "Paid Amount", type: "number", min: 0 },
        { name: "balance", label: "Type of Work Balance", type: "number" },
        { name: "phase_balance", label: "Phase Balance", type: "number" },
      { name: "tax", label: "Tax", type: "number", min: 0 },
      { name: "discount", label: "Discount", type: "number", min: 0 },
      { name: "total_amount", label: "Total Amount", type: "number" },
      { name: "blob_path", label: "Blob Path", type: "text" },
    ],
    generate: (data) => `Prepare an invoice document with these values:

Invoice Number: ${data.invoice_number}
Case Number: ${data.case_id}
Case Title: ${data.case_title}
Client ID: ${data.clientID}
Lawyer ID: ${data.lawyerID}
Client Name: ${data.client_name}
Payment Stage: ${data.payment_stage}
Type of Work: ${data.type_of_work || "N/A"}
Issue Date: ${data.issue_date}
Due Date: ${data.due_date}
Expected Amount: ${data.expected_amount}
Paid Amount: ${data.paid_amount}
Type of Work Balance: ${data.balance}
Phase Balance: ${data.phase_balance}
Tax: ${data.tax}
Discount: ${data.discount}
Total Amount: ${data.total_amount}`,
  },

  {
    id: "report",
    category: "reports",
    title: "Report",
    description: "Simple report format with key sections.",
    fields: [
      { name: "reportTitle", label: "Report Title", type: "text" },
      { name: "date", label: "Date", type: "date" },
      { name: "preparedBy", label: "Prepared By", type: "text" },
      { name: "objective", label: "Objective", type: "textarea" },
      { name: "findings", label: "Findings", type: "textarea" },
      { name: "recommendations", label: "Recommendations", type: "textarea" },
      { name: "conclusion", label: "Conclusion", type: "textarea" },
    ],
    generate: (data) => `Write a simple report:

Title: ${data.reportTitle}
Date: ${data.date}
Prepared By: ${data.preparedBy}
Objective: ${data.objective}
Findings: ${data.findings}
Recommendations: ${data.recommendations}
Conclusion: ${data.conclusion}`,
  },
];
