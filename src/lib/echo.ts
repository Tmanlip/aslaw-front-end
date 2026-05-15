import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import AuthMemory from '../data/authMemory';

// Reverb uses the Pusher protocol, so we give Echo the Pusher broadcaster
// but point it at the local Reverb server (ws://localhost:8080).
(window as any).Pusher = Pusher;

const API_BASE = (process.env.REACT_APP_API_URL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, '');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _echo: Echo<any> | null = null;

/**
 * Returns a shared Echo instance, creating it lazily so the auth token
 * is read after the user has logged in.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEcho(): Echo<any> {
  if (!_echo) {
    _echo = new Echo({
      broadcaster: 'reverb',
      key: process.env.REACT_APP_REVERB_APP_KEY ?? 'pamsn8iwdjibvvaxoeal',
      wsHost: process.env.REACT_APP_REVERB_HOST ?? 'localhost',
      wsPort: Number(process.env.REACT_APP_REVERB_PORT ?? 8080),
      wssPort: Number(process.env.REACT_APP_REVERB_PORT ?? 8080),
      forceTLS: false,
      enabledTransports: ['ws'],
      disableStats: true,
      authEndpoint: `${API_BASE}/api/broadcasting/auth`,
      authorizer: (channel: any) => ({
        authorize: async (socketId: string, callback: (error: any, data: any) => void) => {
          const token = AuthMemory.getToken() ?? '';
          const endpoints = [
            `${API_BASE}/api/broadcasting/auth`,
            `${API_BASE}/broadcasting/auth`,
          ];

          const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          };

          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          for (let i = 0; i < endpoints.length; i += 1) {
            try {
              const response = await fetch(endpoints[i], {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                callback(null, data);
                return;
              }

              if (response.status !== 404 || i === endpoints.length - 1) {
                const data = await response.json().catch(() => ({ message: 'Authorization failed' }));
                callback(data, null);
                return;
              }
            } catch (error) {
              if (i === endpoints.length - 1) {
                callback(error, null);
                return;
              }
            }
          }
        },
      }),
      auth: {
        headers: {
          Authorization: `Bearer ${AuthMemory.getToken() ?? ''}`,
          Accept: 'application/json',
        },
      },
    });
  }
  return _echo;
}

/** Call on logout so the next login gets a fresh instance with the new token. */
export function resetEcho(): void {
  if (_echo) {
    _echo.disconnect();
    _echo = null;
  }
}
