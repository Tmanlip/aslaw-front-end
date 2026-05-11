import React, { useCallback, useEffect, useMemo, useState } from "react";
import AuthMemory from "../../../data/authMemory";
import { Case, ClientFullData, LawyerFullData } from "../../../data/userInfo";
import { fetchClientFullData } from "../../../hooks/clientApi";
import { fetchLawyerFullData } from "../../../hooks/lawyerApi";
import { BackendMeeting, createMeeting, fetchMeetingCases, fetchMeetings, MeetingCaseSummary } from "../../../hooks/meetingApi";
import "./meetingScheduler.css";

type UserRole = "admin" | "client" | "lawyer";
type MeetingMethod = "Online" | "In Person";
type CalendarViewMode = "month" | "week" | "day";

type Meeting = {
  id: string | number;
  caseId: number;
  caseTitle: string;
  counterpartName: string;
  meetingMethod: MeetingMethod;
  agenda: string;
  date: string;
  time: string;
  timezone: string;
  googleEventLink?: string;
};

type MeetingSchedulerProps = {
  role: UserRole;
};

type CounterpartOption = {
  value: string;
  label: string;
  caseId: number;
  caseTitle: string;
  counterpartName: string;
};

const defaultAvailableSlots = [
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
] as const;

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({ role }) => {
  const currentUser = AuthMemory.getUser();
  const userName = currentUser?.name || (role === "lawyer" ? "Lawyer" : role === "admin" ? "Admin" : "Client");
  const counterpartLabel = role === "lawyer" ? "Client" : role === "client" ? "Lawyer" : "Client Case";

  const [counterpartName, setCounterpartName] = useState("");
  const [counterpartOptions, setCounterpartOptions] = useState<CounterpartOption[]>([]);
  const [counterpartLoading, setCounterpartLoading] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetingMethod, setMeetingMethod] = useState<MeetingMethod>("Online");
  const [agenda, setAgenda] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const today = useMemo(() => new Date(), []);
  const todayMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);

  const toDateKey = (value: Date) => value.toISOString().split("T")[0];

  const parseDateTime = (meeting: Meeting) => new Date(`${meeting.date}T${meeting.time}:00`);

  const mapBackendMeeting = useCallback((meeting: BackendMeeting): Meeting => {
    const eventDate = new Date(meeting.start_at);
    const counterpartName =
      role === "lawyer"
        ? meeting.participants?.client?.name || "Client"
        : role === "client"
          ? meeting.participants?.lawyer?.name || "Lawyer"
          : `${meeting.participants?.client?.name || "Client"} (Lawyer: ${meeting.participants?.lawyer?.name || "Lawyer"})`;

    return {
      id: meeting.id,
      caseId: meeting.case_id,
      caseTitle: meeting.case_title || `Case #${meeting.case_id}`,
      counterpartName,
      meetingMethod: (meeting.meeting_method || "Online") as MeetingMethod,
      agenda: meeting.agenda || "",
      date: eventDate.toLocaleDateString("en-CA"),
      time: eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      timezone: meeting.timezone,
      googleEventLink: meeting.google_event_link,
    };
  }, [role]);

  const loadMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    try {
      const response = await fetchMeetings();
      const safeResponse = Array.isArray(response) ? response : [];
      setMeetings(
        safeResponse
          .map(mapBackendMeeting)
          .sort((a, b) => `${a.date}T${a.time}:00`.localeCompare(`${b.date}T${b.time}:00`))
      );
    } catch (error) {
      console.error("Failed to load meetings:", error);
      setErrorMessage("Unable to load upcoming meetings.");
    } finally {
      setMeetingsLoading(false);
    }
  }, [mapBackendMeeting]);

  useEffect(() => {
    loadMeetings();

    const intervalId = window.setInterval(() => {
      loadMeetings();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadMeetings]);

  const calendarData = useMemo(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startOffset = firstDay.getDay();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + index);
      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
      const key = toDateKey(day);
      const dayMeetings = meetings.filter((meeting) => meeting.date === key);

      return {
        key,
        day,
        isCurrentMonth,
        isToday: key === toDateKey(today),
        dayMeetings,
      };
    });
  }, [currentMonth, meetings, today]);

  const weekData = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + index);
      const key = toDateKey(day);
      const dayMeetings = meetings.filter((meeting) => meeting.date === key);

      return {
        key,
        day,
        isToday: key === toDateKey(today),
        dayMeetings,
      };
    });
  }, [meetings, selectedDate, today]);

  const selectedDayMeetings = useMemo(() => {
    const key = toDateKey(selectedDate);
    return meetings
      .filter((meeting) => meeting.date === key)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [meetings, selectedDate]);

  const eventStats = useMemo(() => {
    const online = meetings.filter((meeting) => meeting.meetingMethod === "Online").length;
    const inPerson = meetings.filter((meeting) => meeting.meetingMethod === "In Person").length;
    const upcoming = meetings.filter((meeting) => parseDateTime(meeting) >= today).length;
    const todayMeetings = meetings.filter((meeting) => meeting.date === toDateKey(today)).length;

    return { online, inPerson, upcoming, todayMeetings };
  }, [meetings, today]);

  const upcomingMeetings = useMemo(() => {
    return [...meetings]
      .filter((meeting) => parseDateTime(meeting) >= today)
      .sort((a, b) => parseDateTime(a).getTime() - parseDateTime(b).getTime())
      .slice(0, 6);
  }, [meetings, today]);

  const monthTitle = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedTitle = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const canGoPreviousMonth =
    currentMonth.getFullYear() > todayMonth.getFullYear() ||
    (currentMonth.getFullYear() === todayMonth.getFullYear() && currentMonth.getMonth() > todayMonth.getMonth());

  const goToPreviousMonth = () => {
    if (!canGoPreviousMonth) {
      return;
    }

    if (viewMode === "month") {
      setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1));
      return;
    }

    setSelectedDate((value) => {
      const nextDate = new Date(value);
      nextDate.setDate(nextDate.getDate() - (viewMode === "week" ? 7 : 1));
      return nextDate;
    });
  };

  const goToNextMonth = () => {
    if (viewMode === "month") {
      setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1));
      return;
    }

    setSelectedDate((value) => {
      const nextDate = new Date(value);
      nextDate.setDate(nextDate.getDate() + (viewMode === "week" ? 7 : 1));
      return nextDate;
    });
  };

  const resetToCurrentMonth = () => {
    setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setSelectedDate(new Date());
    setViewMode("month");
  };

  const unavailableSlots = useMemo(() => {
    if (!date) return new Set<string>();

    const now = new Date();
    const selectedDate = new Date(`${date}T00:00:00`);
    const isToday =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();

    const pastSlots = new Set<string>();
    if (isToday) {
      defaultAvailableSlots.forEach((slot) => {
        const slotDateTime = new Date(`${date}T${slot}:00`);
        if (slotDateTime <= now) {
          pastSlots.add(slot);
        }
      });
    }

    const bookedSlots = new Set(
      meetings
        .filter((meeting) => meeting.date === date)
        .map((meeting) => meeting.time)
    );

    return new Set([...bookedSlots, ...pastSlots]);
  }, [date, meetings]);

  const minDate = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    let isMounted = true;

    const buildOptionsFromCases = (cases: Array<Case | MeetingCaseSummary>): CounterpartOption[] => {
      const seen = new Set<string>();

      return cases
        .map((caseItem) => {
          const caseId = Number(caseItem.caseId ?? caseItem.id ?? 0);
          const clientName = String(caseItem.clientName || "").trim();
          const lawyerName = String(caseItem.lawyerName || "").trim();
          const trimmedName =
            role === "lawyer"
              ? clientName
              : role === "client"
                ? lawyerName
                : clientName;

          if (!caseId || !trimmedName) {
            return null;
          }

          const dedupeKey = role === "admin" ? `case-${caseId}` : trimmedName.toLowerCase();

          if (seen.has(dedupeKey)) {
            return null;
          }

          seen.add(dedupeKey);

          const caseTitle = caseItem.title || caseItem.caseName || `Case #${caseId}`;

          return {
            value: `${caseId}:${trimmedName}`,
            label:
              role === "admin"
                ? `${trimmedName} -> ${lawyerName || "Lawyer"} - Case #${caseId}`
                : `${trimmedName} - Case #${caseId}`,
            caseId,
            caseTitle,
            counterpartName:
              role === "admin"
                ? `${trimmedName} (Lawyer: ${lawyerName || "Lawyer"})`
                : trimmedName,
          };
        })
        .filter((item): item is CounterpartOption => Boolean(item));
    };

    const loadCounterparts = async () => {
      setCounterpartLoading(true);

      if (role === "admin") {
        try {
          const cases = await fetchMeetingCases();

          if (!isMounted) return;
          setCounterpartOptions(buildOptionsFromCases(cases));
        } catch (error) {
          console.error("Failed to load admin case list for meetings:", error);
          if (isMounted) {
            setCounterpartOptions([]);
          }
        } finally {
          if (isMounted) {
            setCounterpartLoading(false);
          }
        }

        return;
      }

      try {
        const firmID = currentUser?.firmID;

        if (!firmID) {
          if (isMounted) {
            setCounterpartOptions([]);
          }
          return;
        }

        if (role === "client") {
          const cached = AuthMemory.getClientFullData();
          const data: ClientFullData =
            cached && cached.client?.firmID === firmID
              ? cached
              : await fetchClientFullData(firmID);

          if (!isMounted) return;
          setCounterpartOptions(buildOptionsFromCases(data.cases || []));
          return;
        }

        const data: LawyerFullData = await fetchLawyerFullData(firmID);
        if (!isMounted) return;
        setCounterpartOptions(buildOptionsFromCases(data.cases || []));
      } catch (error) {
        console.error("Failed to load case-linked counterpart list:", error);
        if (isMounted) {
          setCounterpartOptions([]);
        }
      } finally {
        if (isMounted) {
          setCounterpartLoading(false);
        }
      }
    };

    loadCounterparts();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.firmID, role]);

  const clearForm = () => {
    setCounterpartName("");
    setDate("");
    setTime("");
    setMeetingMethod("Online");
    setAgenda("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!counterpartName.trim() || !date || !time || !agenda.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    const selectedOption = counterpartOptions.find((option) => option.value === counterpartName);

    if (!selectedOption) {
      setErrorMessage(`Please select a valid ${counterpartLabel.toLowerCase()} from the list.`);
      return;
    }

    if (unavailableSlots.has(time)) {
      setErrorMessage("This slot is already taken. Please pick another time.");
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuala_Lumpur";
    const startAt = new Date(`${date}T${time}:00`);

    if (Number.isNaN(startAt.getTime())) {
      setErrorMessage("Invalid date/time selected.");
      return;
    }

    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

    try {
      await createMeeting({
        case_id: selectedOption.caseId,
        meeting_method: meetingMethod,
        agenda: agenda.trim(),
        timezone,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
      });

      await loadMeetings();
      setSuccessMessage(role === "admin" ? "Meeting scheduled successfully." : "Meeting request submitted successfully.");
      clearForm();
    } catch (error) {
      console.error("Failed to create meeting:", error);
      setErrorMessage("Failed to schedule meeting. Please try again.");
    }
  };

  return (
    <div className="meeting-scheduler-page">
      <section className="meeting-scheduler-hero">
        <div>
          <p className="meeting-scheduler-role">{role.toUpperCase()} CALENDAR</p>
          <h1>Schedule and manage your events</h1>
          <p>
            Follow the Metis calendar-style layout for meetings, booking requests, and upcoming sessions.
          </p>
        </div>
        <div className="meeting-scheduler-meta">
          <span>Logged in as: {userName}</span>
          <span>Current view: {monthTitle}</span>
          <span>
            Booking with: {role === "admin" ? "Client case (auto-invites assigned lawyer)" : counterpartLabel}
          </span>
        </div>
      </section>

      <section className="meeting-scheduler-toolbar-card">
        <div className="meeting-scheduler-toolbar-left">
          <button
            type="button"
            className="meeting-scheduler-toolbar-btn"
            onClick={goToPreviousMonth}
            disabled={viewMode === "month" && !canGoPreviousMonth}
          >
            Prev
          </button>
          <button type="button" className="meeting-scheduler-toolbar-btn" onClick={resetToCurrentMonth}>
            Today
          </button>
          <button type="button" className="meeting-scheduler-toolbar-btn" onClick={goToNextMonth}>
            Next
          </button>
        </div>

        <div className="meeting-scheduler-toolbar-center">
          <h2>{monthTitle}</h2>
          <p>Month view</p>
        </div>

        <div className="meeting-scheduler-toolbar-right">
          <button
            type="button"
            className={`meeting-scheduler-toolbar-btn ${viewMode === "month" ? "is-primary" : ""}`}
            onClick={() => setViewMode("month")}
          >
            Month
          </button>
          <button
            type="button"
            className={`meeting-scheduler-toolbar-btn ${viewMode === "week" ? "is-primary" : ""}`}
            onClick={() => setViewMode("week")}
          >
            Week
          </button>
          <button
            type="button"
            className={`meeting-scheduler-toolbar-btn ${viewMode === "day" ? "is-primary" : ""}`}
            onClick={() => setViewMode("day")}
          >
            Day
          </button>
        </div>
      </section>

      <section className="meeting-scheduler-dashboard">
        <section className="meeting-scheduler-card meeting-scheduler-calendar-card">
          <div className="meeting-scheduler-card-header">
            <div>
              <p className="meeting-scheduler-kicker">Calendar</p>
              <h2>{monthTitle}</h2>
              {viewMode !== "month" && <p className="meeting-scheduler-view-subtitle">Viewing {selectedTitle}</p>}
            </div>
            <div className="meeting-scheduler-stats">
              <span>Meetings: {meetings.length}</span>
              <span>Today: {eventStats.todayMeetings}</span>
            </div>
          </div>

          <div className="meeting-scheduler-legend">
            <span><i className="legend-dot is-meeting" /> Meetings {meetings.length}</span>
            <span><i className="legend-dot is-online" /> Online {eventStats.online}</span>
            <span><i className="legend-dot is-person" /> In Person {eventStats.inPerson}</span>
            <span><i className="legend-dot is-today" /> Today {eventStats.todayMeetings}</span>
          </div>

          {viewMode === "month" && (
            <>
              <div className="meeting-scheduler-weekdays">
                {weekdayLabels.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="meeting-scheduler-calendar-grid">
                {calendarData.map((cell) => (
                  <button
                    key={cell.key}
                    type="button"
                    className={`meeting-scheduler-day-cell ${cell.isCurrentMonth ? "" : "is-outside"} ${cell.isToday ? "is-today" : ""}`}
                    onClick={() => setSelectedDate(cell.day)}
                  >
                    <div className="meeting-scheduler-day-top">
                      <span className="meeting-scheduler-day-number">{cell.day.getDate()}</span>
                      {cell.dayMeetings.length > 0 && <span className="meeting-scheduler-day-count">{cell.dayMeetings.length}</span>}
                    </div>

                    <div className="meeting-scheduler-day-events">
                      {cell.dayMeetings.slice(0, 2).map((meeting) => (
                        <div
                          key={meeting.id}
                          className={`meeting-scheduler-day-event ${meeting.meetingMethod === "Online" ? "is-online" : "is-person"}`}
                        >
                          <strong>{meeting.time}</strong>
                          <span>{meeting.counterpartName}</span>
                        </div>
                      ))}
                      {cell.dayMeetings.length > 2 && (
                        <span className="meeting-scheduler-more">+{cell.dayMeetings.length - 2} more</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {viewMode === "week" && (
            <div className="meeting-scheduler-week-view">
              {weekData.map((cell) => (
                <button
                  key={cell.key}
                  type="button"
                  className={`meeting-scheduler-week-day ${cell.isToday ? "is-today" : ""}`}
                  onClick={() => setSelectedDate(cell.day)}
                >
                  <div className="meeting-scheduler-week-day-head">
                    <span>{weekdayLabels[cell.day.getDay()]}</span>
                    <strong>{cell.day.getDate()}</strong>
                  </div>
                  <div className="meeting-scheduler-week-day-body">
                    {cell.dayMeetings.length === 0 ? (
                      <span className="meeting-scheduler-empty-slot">No meetings</span>
                    ) : (
                      cell.dayMeetings.slice(0, 3).map((meeting) => (
                        <div
                          key={meeting.id}
                          className={`meeting-scheduler-day-event ${meeting.meetingMethod === "Online" ? "is-online" : "is-person"}`}
                        >
                          <strong>{meeting.time}</strong>
                          <span>{meeting.counterpartName}</span>
                        </div>
                      ))
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {viewMode === "day" && (
            <div className="meeting-scheduler-day-view">
              <div className="meeting-scheduler-day-view-head">
                <h3>{selectedTitle}</h3>
                <span>{selectedDayMeetings.length} meetings</span>
              </div>

              <div className="meeting-scheduler-day-view-list">
                {selectedDayMeetings.length === 0 ? (
                  <div className="meeting-scheduler-day-empty">
                    No meetings scheduled for this date.
                  </div>
                ) : (
                  selectedDayMeetings.map((meeting) => (
                    <article key={meeting.id} className="meeting-scheduler-day-detail-card">
                      <div className="meeting-scheduler-item-top">
                        <h3>{meeting.counterpartName}</h3>
                        <span className="meeting-scheduler-status meeting-scheduler-status-confirmed">Scheduled</span>
                      </div>
                      <p>{meeting.time} ({meeting.timezone})</p>
                      <p>Method: {meeting.meetingMethod}</p>
                      <p>{meeting.caseTitle} (#{meeting.caseId})</p>
                      {meeting.agenda && <p>Agenda: {meeting.agenda}</p>}
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="meeting-scheduler-side-column">
          <section className="meeting-scheduler-card meeting-scheduler-summary-card">
            <h2>Event Categories</h2>
            <div className="meeting-scheduler-category-list">
              <div className="meeting-scheduler-category-item">
                <span>Meetings</span>
                <strong>{meetings.length}</strong>
              </div>
              <div className="meeting-scheduler-category-item">
                <span>Upcoming</span>
                <strong>{eventStats.upcoming}</strong>
              </div>
              <div className="meeting-scheduler-category-item">
                <span>Online</span>
                <strong>{eventStats.online}</strong>
              </div>
              <div className="meeting-scheduler-category-item">
                <span>In Person</span>
                <strong>{eventStats.inPerson}</strong>
              </div>
            </div>
          </section>

          <section className="meeting-scheduler-card meeting-scheduler-upcoming-card">
            <div className="meeting-scheduler-card-header compact">
              <div>
                <p className="meeting-scheduler-kicker">Upcoming Events</p>
                <h2>Upcoming Meetings</h2>
              </div>
            </div>

            <div className="meeting-scheduler-list">
              {meetingsLoading && (
                <p className="meeting-scheduler-note">Loading meetings...</p>
              )}

              {!meetingsLoading && upcomingMeetings.length === 0 && (
                <p className="meeting-scheduler-note">No upcoming meetings found.</p>
              )}

              {upcomingMeetings.map((meeting) => (
                <article key={meeting.id} className="meeting-scheduler-item">
                  <div className="meeting-scheduler-item-top">
                    <h3>{meeting.counterpartName}</h3>
                    <span className="meeting-scheduler-status meeting-scheduler-status-confirmed">
                      Scheduled
                    </span>
                  </div>

                  <p>
                    {meeting.date} at {meeting.time} ({meeting.timezone})
                  </p>
                  <p>Method: {meeting.meetingMethod}</p>
                  <p>
                    {meeting.caseTitle} (#{meeting.caseId})
                  </p>
                  {meeting.agenda && <p>Agenda: {meeting.agenda}</p>}
                  {meeting.googleEventLink && (
                    <p>
                      <a href={meeting.googleEventLink} target="_blank" rel="noreferrer">
                        Open Google Calendar Event
                      </a>
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>

          <form className="meeting-scheduler-card meeting-scheduler-form-card" onSubmit={handleSubmit}>
            <div className="meeting-scheduler-card-header compact">
              <div>
                <p className="meeting-scheduler-kicker">Add Event</p>
                <h2>{role === "admin" ? "Schedule Case Meeting" : "New Meeting Request"}</h2>
              </div>
            </div>

            <label htmlFor="counterpartName">{role === "admin" ? "Client Case" : `${counterpartLabel} Name`}</label>
            <select
              id="counterpartName"
              value={counterpartName}
              onChange={(event) => setCounterpartName(event.target.value)}
              disabled={counterpartLoading || counterpartOptions.length === 0}
              required
            >
              <option value="">
                {counterpartLoading
                  ? `Loading ${counterpartLabel.toLowerCase()} list...`
                  : role === "admin"
                    ? "Select a client case (lawyer auto-assigned by case)"
                    : `Select ${counterpartLabel.toLowerCase()} from your case list`}
              </option>
              {counterpartOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {!counterpartLoading && counterpartOptions.length === 0 && (
              <p className="meeting-scheduler-note">
                {role === "admin"
                  ? "No case-linked client/lawyer pair found yet. Assign a case first, then schedule a meeting."
                  : `No linked ${counterpartLabel.toLowerCase()} found. You can only schedule with users connected to your case.`}
              </p>
            )}

            {role === "admin" && (
              <p className="meeting-scheduler-note">
                Admin scheduling uses the selected case. The assigned lawyer and client for that case will be invited automatically.
              </p>
            )}

            <div className="meeting-scheduler-row">
              <div>
                <label htmlFor="meetingDate">Date</label>
                <input
                  id="meetingDate"
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="meetingTime">Time Slot</label>
                <select
                  id="meetingTime"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  required
                >
                  <option value="">Select a slot</option>
                  {defaultAvailableSlots.map((slot) => (
                    <option
                      key={slot}
                      value={slot}
                      disabled={unavailableSlots.has(slot)}
                    >
                      {slot} {unavailableSlots.has(slot) ? "(Unavailable)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label htmlFor="meetingMethod">Meeting Method</label>
            <select
              id="meetingMethod"
              value={meetingMethod}
              onChange={(event) => setMeetingMethod(event.target.value as MeetingMethod)}
              required
            >
              <option value="Online">Online</option>
              <option value="In Person">In Person</option>
            </select>

            <label htmlFor="meetingAgenda">Agenda</label>
            <textarea
              id="meetingAgenda"
              value={agenda}
              onChange={(event) => setAgenda(event.target.value)}
              rows={4}
              placeholder="Write the discussion agenda"
              required
            />

            {errorMessage && <p className="meeting-scheduler-error">{errorMessage}</p>}
            {successMessage && (
              <p className="meeting-scheduler-success">{successMessage}</p>
            )}

            <button type="submit">{role === "admin" ? "Schedule Meeting" : "Request Meeting"}</button>
          </form>
        </aside>
      </section>
    </div>
  );
};

export default MeetingScheduler;
