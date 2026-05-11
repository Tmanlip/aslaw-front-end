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
