import { io, Socket } from 'socket.io-client';
import { ActionAckResponse } from '@bhabhi/shared';

function getServerUrl(): string {
  if (typeof import.meta !== 'undefined') {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (env?.VITE_SOCKET_URL) return env.VITE_SOCKET_URL;
    if (env?.VITE_API_URL) return env.VITE_API_URL;
    if (env?.VITE_SERVER_URL) return env.VITE_SERVER_URL;
  }
  if (typeof window !== 'undefined') {
    // If running in Vite dev server (port 5173 / 4173), default server is on port 3001
    const { hostname, port, protocol } = window.location;
    if (port === '5173' || port === '4173') {
      return `${protocol}//${hostname}:3001`;
    }
    // Native Capacitor Android webview default fallback (10.0.2.2 for emulator)
    if (hostname === 'localhost' && (!port || port === '80' || port === '443')) {
      return 'http://10.0.2.2:3001';
    }
    return window.location.origin;
  }
  return 'http://localhost:3001';
}

export class SocketClient {
  private socket: Socket | null = null;
  private url: string;

  constructor() {
    this.url = getServerUrl();
  }

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        console.log('[SOCKET] Connected to multiplayer server:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SOCKET] Disconnected:', reason);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[SOCKET] Connection error:', err.message);
      });
    } else if (!this.socket.connected) {
      this.socket.connect();
    }

    return this.socket;
  }

  public getSocket(): Socket {
    return this.socket || this.connect();
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public getId(): string | undefined {
    return this.socket?.id;
  }

  public emitWithAck<T>(event: string, payload: unknown, timeoutMs = 8000): Promise<ActionAckResponse<T>> {
    const s = this.getSocket();
    return new Promise((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            error: 'Request timed out. Please check your connection and retry.',
          });
        }
      }, timeoutMs);

      s.emit(event, payload, (response: ActionAckResponse<T>) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(response);
        }
      });
    });
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.getSocket().on(event, listener);
  }

  public off(event: string, listener?: (...args: any[]) => void): void {
    if (this.socket) {
      if (listener) {
        this.socket.off(event, listener);
      } else {
        this.socket.off(event);
      }
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketClient = new SocketClient();
