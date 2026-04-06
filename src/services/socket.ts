import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(window.location.origin, {
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (token: string) => {
  const s = getSocket();
  s.connect();
  s.emit('authenticate', token);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
