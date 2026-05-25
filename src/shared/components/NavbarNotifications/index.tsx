import React, { useEffect, useMemo, useRef, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import { apiFetch } from "../../../hooks/api";
import { useAuth } from "../../../context/AuthContext";
import { getEcho } from "../../../lib/echo";
import { subscribeToWebPubSubNotifications } from "../../../lib/webPubSubNotifications";
import { resolveRealtimeDriver } from "../../../lib/realtimeDriver";

type NavbarNotificationsProps = {
  scopeKey: "admin" | "adminstaff" | "junioradmin" | "client" | "lawyer";
  targetPath: string;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
};

type RealtimeActivity = {
  title: string;
  message: string;
  category?: string;
  createdAt?: string;
};

type NotificationsResponse = {
  data?: Array<{
    id: string;
    title?: string;
    message?: string;
    read_at?: string | null;
    created_at?: string;
  }>;
  unread_count?: number;
};

const MIN_FETCH_GAP_MS = 4000;
let globalNotificationsInFlight = false;
let globalLastNotificationsFetchAt = 0;
const REALTIME_DRIVER = resolveRealtimeDriver();

const normalizeRealtimeActivity = (payload: unknown): RealtimeActivity | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const nested = candidate.data && typeof candidate.data === "object" ? (candidate.data as Record<string, unknown>) : null;
  const source = nested ?? candidate;

  const title = typeof source.title === "string" ? source.title : typeof source.event === "string" ? source.event : "Realtime update";
  const message = typeof source.message === "string" ? source.message : "An update was received.";

  return {
    title,
    message,
    category: typeof source.category === "string" ? source.category : undefined,
    createdAt: typeof source.created_at === "string" ? source.created_at : undefined,
  };
};

const formatDateTime = (input?: string): string => {
  if (!input) return "Unknown date";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const NavbarNotifications: React.FC<NavbarNotificationsProps> = ({ scopeKey }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCountFromApi, setUnreadCountFromApi] = useState(0);
  const [markingIds, setMarkingIds] = useState<Record<string, boolean>>({});
  const [liveActivity, setLiveActivity] = useState<RealtimeActivity | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const liveActivityTimerRef = useRef<number | null>(null);

  const unreadCount = useMemo(() => {
    return Math.max(unreadCountFromApi, notifications.length);
  }, [notifications.length, unreadCountFromApi]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (!wrapRef.current?.contains(targetNode)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    void loadNotifications({ force: true });
    return () => {
      // Polling is intentionally disabled to avoid request storms.
    };
  }, []);

  useEffect(() => {
    if (!liveActivity) {
      return () => undefined;
    }

    if (liveActivityTimerRef.current) {
      window.clearTimeout(liveActivityTimerRef.current);
    }

    liveActivityTimerRef.current = window.setTimeout(() => {
      setLiveActivity(null);
    }, 6000);

    return () => {
      if (liveActivityTimerRef.current) {
        window.clearTimeout(liveActivityTimerRef.current);
        liveActivityTimerRef.current = null;
      }
    };
  }, [liveActivity]);

  // Real-time notifications from either Azure Web PubSub or Reverb.
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    if (REALTIME_DRIVER === "webpubsub") {
      const dispose = subscribeToWebPubSubNotifications(
        (payload) => {
          const activity = normalizeRealtimeActivity(payload);
          if (activity) {
            setLiveActivity(activity);
          }
          void loadNotifications({ force: true });
        },
        (err) => {
          console.warn("Azure Web PubSub connection issue, notifications may be delayed", err);
        }
      );

      return () => {
        dispose();
      };
    }

    let channel: ReturnType<ReturnType<typeof getEcho>["private"]> | null = null;

    try {
      channel = getEcho().private(`App.Models.User.${userId}`);
      channel.listen(".UserNotificationCreated", (payload: unknown) => {
        const activity = normalizeRealtimeActivity(payload);
        if (activity) {
          setLiveActivity(activity);
        }
        void loadNotifications({ force: true });
      });
    } catch (err) {
      console.warn("Reverb WebSocket subscription failed, falling back to polling", err);
    }

    return () => {
      try {
        getEcho().leave(`App.Models.User.${userId}`);
      } catch {
        // ignore cleanup errors
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadNotifications = async ({ force = false }: { force?: boolean } = {}) => {
    if (globalNotificationsInFlight) {
      return;
    }

    const now = Date.now();
    if (!force && now - globalLastNotificationsFetchAt < MIN_FETCH_GAP_MS) {
      return;
    }

    globalNotificationsInFlight = true;
    globalLastNotificationsFetchAt = now;
    setIsLoading(true);
    setError("");

    try {
      const response = (await apiFetch("/notifications?limit=10", { method: "GET" })) as NotificationsResponse;
      const items: NotificationItem[] = Array.isArray(response.data)
        ? response.data.map((item) => ({
            id: String(item.id),
            title: item.title || "Notification",
            message: item.message || "",
            readAt: item.read_at ?? null,
            createdAt: item.created_at || new Date().toISOString(),
          })).filter((item) => !item.readAt)
        : [];
      setNotifications(items);
      setUnreadCountFromApi(Number(response.unread_count || 0));
    } catch (err) {
      console.error("Failed to load navbar notifications", err);
      setError("Unable to load notifications.");
      setUnreadCountFromApi(0);
    } finally {
      globalNotificationsInFlight = false;
      setIsLoading(false);
    }
  };

  const markOneAsRead = async (notificationId: string) => {
    if (markingIds[notificationId]) {
      return;
    }

    setMarkingIds((prev) => ({ ...prev, [notificationId]: true }));

    try {
      await apiFetch("/notifications/mark-read", {
        method: "POST",
        body: JSON.stringify({ id: notificationId }),
      });

      setUnreadCountFromApi((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    } finally {
      setMarkingIds((prev) => {
        const next = { ...prev };
        delete next[notificationId];
        return next;
      });
    }
  };

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    if (nextOpen) {
      void loadNotifications({ force: true });
    }
  };

  return (
    <div className="aslaw-metis-notification-wrap" ref={wrapRef}>
      {liveActivity && (
        <div className="aslaw-metis-live-toast" role="status" aria-live="polite">
          <div className="aslaw-metis-live-toast-head">
            <span className="aslaw-metis-live-toast-pill">
              {String(liveActivity.category || liveActivity.title || "update").replace(/_/g, " ")}
            </span>
            <button
              type="button"
              className="aslaw-metis-live-toast-close"
              aria-label="Dismiss live update"
              onClick={() => setLiveActivity(null)}
            >
              ×
            </button>
          </div>
          <strong>{liveActivity.title}</strong>
          <p>{liveActivity.message}</p>
          <small>{formatDateTime(liveActivity.createdAt)}</small>
        </div>
      )}

      <button
        type="button"
        className="aslaw-metis-notification-btn"
        aria-label="Notifications"
        title="Notifications"
        onClick={handleToggle}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="aslaw-metis-notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="aslaw-metis-notification-panel" role="dialog" aria-label="Notifications">
          <div className="aslaw-metis-notification-head">
            <h6>Notifications</h6>
            <span>Latest updates</span>
          </div>

          {isLoading && (
            <div className="aslaw-metis-notification-state">
              <Spinner animation="border" size="sm" />
              <span>Loading...</span>
            </div>
          )}

          {!isLoading && error && <p className="aslaw-metis-notification-error">{error}</p>}

          {!isLoading && !error && notifications.length === 0 && (
            <p className="aslaw-metis-notification-empty">No notifications yet.</p>
          )}

          {!isLoading && !error && notifications.length > 0 && (
            <ul className="aslaw-metis-notification-list">
              {notifications.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="aslaw-metis-notification-item"
                    role="article"
                    aria-label="Notification item"
                    onClick={() => void markOneAsRead(item.id)}
                    disabled={Boolean(markingIds[item.id])}
                  >
                    <span className="aslaw-metis-notification-checkbox" aria-hidden="true">
                      {markingIds[item.id] ? "..." : "☐"}
                    </span>
                    <span className="aslaw-metis-notification-content">
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                      <small>{formatDateTime(item.createdAt)}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NavbarNotifications;
