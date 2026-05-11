import { buildOfficialEmail } from "./officialEmailBuilder";
import { buildEmergencyLeave } from "./emergencyLeaveBuilder";
import { buildAnnualLeave } from "./annualLeaveBuilder";
import { buildMedicalLeave } from "./medicalLeaveBuilder";
import { buildMeetingMinutes } from "./meetingMinutesBuilder";
import { buildProjectUpdate } from "./projectUpdateBuilder";
import { buildFormalLetter } from "./formalLetterBuilder";
import { buildWritOfSummons } from "./writOfSummonsBuilder";
import { buildInvoice } from "./invoiceBuilder";
import { buildReport } from "./reportBuilder";
export const deterministicTemplateBuilders = {
  "official-email": buildOfficialEmail,
  "emergency-leave": buildEmergencyLeave,
  "annual-leave": buildAnnualLeave,
  "medical-leave": buildMedicalLeave,
  "meeting-minutes": buildMeetingMinutes,
  "project-update": buildProjectUpdate,
  "formal-letter": buildFormalLetter,
  "writ-of-summons": buildWritOfSummons,
  invoice: buildInvoice,
  report: buildReport,
};
