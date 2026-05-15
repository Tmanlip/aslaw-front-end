import React, { useEffect, useMemo, useRef, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import { apiFetch } from "../../../hooks/api";
import { useAuth } from "../../../context/AuthContext";
import { getEcho } from "../../../lib/echo";

type NavbarNotificationsProps = {
  scopeKey: "admin" | "junioradmin" | "client" | "lawyer";
  targetPath: string;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
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
  const wrapRef = useRef<HTMLDivElement | null>(null);

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

  // Real-time WebSocket subscription via Laravel Reverb
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    let channel: ReturnType<ReturnType<typeof getEcho>["private"]> | null = null;

    try {
      channel = getEcho().private(`App.Models.User.${userId}`);
      channel.listen(".UserNotificationCreated", () => {
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
