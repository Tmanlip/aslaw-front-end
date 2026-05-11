import {
  chooseByLanguage,
  formatBulletedList,
  formatNumberedList,
  splitListInput,
} from "./utils";

export const buildMeetingMinutes = (data, language = "english") => {
  const attendees = splitListInput(data.attendees);
  const agenda = splitListInput(data.agenda);
  const decisions = splitListInput(data.decisions);
  const actionItems = splitListInput(data.actionItems);

  const title = chooseByLanguage(language, "Meeting Minutes", "Minit Mesyuarat");
  const meetingLabel = chooseByLanguage(language, "Meeting", "Mesyuarat");
  const dateLabel = chooseByLanguage(language, "Date", "Tarikh");
  const attendeesLabel = chooseByLanguage(language, "Attendees", "Kehadiran");
  const agendaLabel = chooseByLanguage(language, "Agenda", "Agenda");
  const decisionsLabel = chooseByLanguage(language, "Decisions", "Keputusan");
  const actionItemsLabel = chooseByLanguage(language, "Action Items", "Tindakan Susulan");
  const naValue = chooseByLanguage(language, "N/A", "Tiada");

  return [
    title,
    `${meetingLabel}: ${data.meetingTitle || naValue}`,
    `${dateLabel}: ${data.date || naValue}`,
    "",
    `${attendeesLabel}:`,
    formatNumberedList(attendees),
    "",
    `${agendaLabel}:`,
    formatBulletedList(agenda),
    "",
    `${decisionsLabel}:`,
    formatNumberedList(decisions),
    "",
    `${actionItemsLabel}:`,
    formatNumberedList(actionItems),
  ].join("\n");
};
