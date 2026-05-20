import { cleanLine } from "./utils";

const checkboxLine = (checked, label) => `[${checked ? "x" : " "}] ${label}`;

export const buildFormalLetter = (data) => {
  const value = (fieldName) => cleanLine(data[fieldName], "");
  const demandDays = cleanLine(data.PaymentWindowDays, "5");
  const defamationDetails = [
    value("BackgroundFacts"),
    value("DefamationActs"),
    value("DefamatoryStatementsDetails"),
    value("ImageUploadDetails"),
    value("AdditionalPublicationDetails"),
    value("ReshareDetails"),
  ]
    .filter((item) => item !== "")
    .map((item, index) => `${index + 1}. ${item}`);

  return [
    "Delivery Method:",
    checkboxLine(Boolean(data.DeliveryByRegisteredPost), "By Registered Post"),
    checkboxLine(Boolean(data.DeliveryByHand), "By Hand"),
    checkboxLine(Boolean(data.DeliveryByOrdinaryPost), "By Ordinary Post"),
    checkboxLine(Boolean(data.DeliveryByWhatsAppEmail), "By Whatsapp / Email"),
    checkboxLine(Boolean(data.DeliveryByCourier), "By Courier"),
    checkboxLine(Boolean(data.DeliveryByARRegisteredPost), "By A.R. Registered Post"),
    "",
    `Ruj Tuan : ${value("Reference")}`,
    `Ruj Kami : ${value("Reference")}`,
    `Tarikh : ${value("Date")}`,
    "",
    value("RecipientName"),
    value("RecipientCompanyName"),
    value("RecipientAddressLine1"),
    value("RecipientAddressLine2"),
    "",
    "Tuan/Puan,",
    `PER : ${value("GoodsOrServices")}`,
    "",
    `Merujuk kepada perkara di atas di mana kami bertindak bagi pihak ${value("ClientName")} ("Anakguam kami") yang mempunyai alamat penyampaian di ${value("ClientServiceAddress")}.`,
    "Adalah dimaklumkan bahawa pihak kami telah diarahkan oleh Anakguam kami untuk menyatakan seperti berikut:",
    ...defamationDetails,
    "",
    `Kenyataan pada ${value("Date")} meraih perhatian awam di akaun ${value("MainSocialAccount")} serta tersebar dengan meluas.`,
    "Akibat penyiaran tersebut, reputasi Anakguam kami terjejas dan kerugian serius telah berlaku.",
    "",
    "SILA AMBIL PERHATIAN, oleh kerana pihak Tuan/Puan telah membuat Pernyataan-Pernyataan Fitnah tersebut kepada Anakguam kami, MAKA kami dengan ini diarahkan oleh Anakguam kami untuk membuat TUNTUTAN TERHADAP PIHAK TUAN/PUAN seperti berikut:",
    `i. Dalam masa ${demandDays} hari dari tarikh surat ini, pihak Tuan/Puan memadam semua kenyataan yang mengandungi Pernyataan-Pernyataan Fitnah tersebut.`,
    `ii. Dalam masa ${demandDays} hari dari tarikh surat ini, pihak Tuan/Puan mengeluarkan dan menerbitkan akujanji bahawa kenyataan yang sama tidak akan diulangi.`,
    `iii. Dalam masa ${demandDays} hari dari tarikh surat ini, pihak Tuan/Puan mengemukakan draf permohonan maaf secara bertulis dan video kepada pihak kami.`,
    "iv. Selepas kelulusan pihak kami, permohonan maaf tersebut hendaklah disiarkan pada semua akaun media sosial milik pihak Tuan/Puan secara umum (public) secara berterusan.",
    `v. Dalam masa ${demandDays} hari dari tarikh surat ini, pihak Tuan/Puan membayar gantirugi sebanyak ${value("Currency")} ${value("AmountDue")} kepada Anakguam kami atau kepada kami sebagai peguamcara.`,
    "",
    "SILA AMBIL PERHATIAN SETERUSNYA bahawa tuntutan-tuntutan di atas dibuat tanpa prasangka ke atas hak-hak dan remedi yang tersedia kepada Anakguam kami. Jika pihak Tuan/Puan gagal dan enggan untuk berbuat sedemikian, maka kami mempunyai arahan tegas Anakguam kami untuk memfailkan tindakan sivil di Mahkamah tanpa notis lanjut.",
    "",
    "Sekian, terima kasih.",
    "Yang benar,",
    `Untuk ${value("YourCompanyName")}`,
    "",
    "__________________________________________",
    value("YourSignerName"),
    value("YourSignerTitle"),
    `No. telefon: ${value("ContactPhone")}`,
    `E-mel: ${value("ContactEmail")}`,
    `Arahan bayaran: ${value("PaymentInstructions")}`,
    `E-mel resit/bukti bayaran: ${value("RemittanceEmail")}`,
  ].join("\n");
};
