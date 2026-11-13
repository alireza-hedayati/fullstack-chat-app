import { io, Socket } from 'socket.io-client';
import { clearAuth } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function connectSocket(token: string): Socket {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(API_BASE, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socketInstance.on('connect_error', (err) => {
    if (err.message === 'Not authenticated') {
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  });

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
