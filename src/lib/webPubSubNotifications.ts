import { apiFetch } from '../hooks/api';

type NegotiateResponse = {
  url?: string;
};

type Dispose = () => void;

const BASE_RECONNECT_MS = 3_000;
const MAX_RECONNECT_MS = 60_000;

export function subscribeToWebPubSubNotifications(
  onMessage: (payload: unknown) => void,
  onError?: (error: unknown) => void,
): Dispose {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let isDisposed = false;
  let attempt = 0;

  const scheduleReconnect = () => {
    if (isDisposed) return;
    // Exponential backoff: 3s, 6s, 12s, 24s, 48s, 60s (capped)
    const delay = Math.min(BASE_RECONNECT_MS * Math.pow(2, attempt), MAX_RECONNECT_MS);
    attempt += 1;
    reconnectTimer = setTimeout(() => {
      void connect();
    }, delay);
  };

  const connect = async () => {
    try {
      const negotiation = (await apiFetch('/realtime/negotiate', {
        method: 'POST',
      })) as NegotiateResponse;

      if (!negotiation.url) {
        throw new Error('Realtime negotiate response did not include a URL.');
      }

      socket = new WebSocket(negotiation.url);

      socket.onopen = () => {
        // Reset backoff counter on successful connection.
        attempt = 0;
      };

      socket.onmessage = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data as string);
          onMessage(parsed);
        } catch {
          onMessage(event.data);
        }
      };

      socket.onerror = (event) => {
        onError?.(event);
      };

      socket.onclose = () => {
        socket = null;
        scheduleReconnect();
      };
    } catch (error) {
      onError?.(error);
      scheduleReconnect();
    }
  };

  void connect();

  return () => {
    isDisposed = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (socket && socket.readyState <= WebSocket.OPEN) {
      socket.close();
      socket = null;
    }
  };
}
