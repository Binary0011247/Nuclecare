import React, { createContext, useEffect } from 'react';
import io from 'socket.io-client';

// Get the base URL for our backend from the environment variables.
// This ensures it works for both local development and production.
const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create the socket connection instance.
// This one instance will be shared across the entire application.
const socket = io(SERVER_URL, {
  // We can add options here if needed, e.g., for authentication later
});

// Create the React Context object.
export const SocketContext = createContext();

// Create the Provider component.
// This component will wrap our application and provide the socket instance.
export const SocketProvider = ({ children }) => {

  // It's good practice to add listeners for core connection events for debugging.
  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Socket.IO: Connected to server with ID:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO: Disconnected from server.');
    });

    // Cleanup listeners when the app unmounts
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  // The value provided by the context is the socket instance itself.
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};