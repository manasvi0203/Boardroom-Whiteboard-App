import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user } = useAuth();    //gets the logged in user
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    
    let isCurrent = true;

    socket.on('connect', () => {
      if (isCurrent) setConnected(true);
    });

    socket.on('disconnect', () => {
      if (isCurrent) setConnected(false);
    });

    socket.on('connect_error', (err) => {
      // Surface auth/connection issues in the console without crashing the UI.
      console.warn('Socket connection error:', err.message);
    });

    //cleanup
    return () => {
      isCurrent = false;
      socket.disconnect(); //close connection

      //only clear if it points to the same socket instance
      if (socketRef.current === socket) socketRef.current = null;  
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);