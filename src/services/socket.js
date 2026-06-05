import io from 'socket.io-client';

let socket = null;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

export const setupSocketConnection = (token) => {
  if (socket) return;

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket.io connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket.io disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket.io error:', error);
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const onSocketEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

export const offSocketEvent = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

export const emitSocketEvent = (event, data) => {
  if (socket) {
    socket.emit(event, data);
  }
};
