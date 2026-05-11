import { apiFetch } from "./api";

type MeetingParticipant = {
  id?: number;
  firmID?: string;
  name?: string;
  email?: string;
};

export type BackendMeeting = {
  id: number;
  case_id: number;
  case_title?: string;
  meeting_method?: "Online" | "In Person";
  agenda?: string;
  timezone: string;
  start_at: string;
  end_at: string;
  google_event_id?: string;
  google_event_link?: string;
  participants?: {
    lawyer?: MeetingParticipant;
    client?: MeetingParticipant;
  };
  organizer?: MeetingParticipant;
};

type MeetingsListResponse = {
  meetings: BackendMeeting[];
};

export type MeetingCaseSummary = {
  caseId?: number;
  id?: number;
  title?: string;
  caseName?: string;
  clientName?: string;
  lawyerName?: string;
};

export type CreateMeetingPayload = {
  case_id: number;
  meeting_method: "Online" | "In Person";
  agenda: string;
  timezone: string;
  start_at: string;
  end_at: string;
};

type CreateMeetingResponse = {
  meeting: BackendMeeting;
  message: string;
};

export const fetchMeetings = async (): Promise<BackendMeeting[]> => {
  const response = await apiFetch("/meetings", { method: "GET" });
  return (response as MeetingsListResponse).meetings || [];
};

export const createMeeting = async (
  payload: CreateMeetingPayload
): Promise<BackendMeeting> => {
  const response = await apiFetch("/meetings", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return (response as CreateMeetingResponse).meeting;
};

export const fetchMeetingCases = async (): Promise<MeetingCaseSummary[]> => {
  const response = await apiFetch("/cases", { method: "GET" });
  return Array.isArray(response) ? (response as MeetingCaseSummary[]) : [];
};
