import { apiFetch } from '../hooks/api';

type NegotiateResponse = {
  url?: string;
};

type Dispose = () => void;

export function subscribeToWebPubSubNotifications(
  onMessage: (payload: unknown) => void,
  onError?: (error: unknown) => void,
): Dispose {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let isDisposed = false;

  const connect = async () => {
    try {
      const negotiation = (await apiFetch('/realtime/negotiate', {
        method: 'POST',
      })) as NegotiateResponse;

      if (!negotiation.url) {
        throw new Error('Realtime negotiate response did not include a URL.');
      }

      socket = new WebSocket(negotiation.url);

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
        if (!isDisposed) {
          reconnectTimer = setTimeout(() => {
            void connect();
          }, 3000);
        }
      };
    } catch (error) {
      onError?.(error);

      if (!isDisposed) {
        reconnectTimer = setTimeout(() => {
          void connect();
        }, 3000);
      }
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
