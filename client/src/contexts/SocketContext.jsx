import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  onlineUsers: new Set()
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, userId }) => {
  console.log('🔍 SocketProvider - Component rendered with userId:', userId);
  
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Debug userId changes
  useEffect(() => {
    console.log('🔍 SocketProvider - userId changed to:', userId, 'Type:', typeof userId);
  }, [userId]);

  useEffect(() => {
    console.log('🔍 SocketProvider - useEffect triggered with userId:', userId);
    // Only connect if we have a userId (user is logged in)
    if (userId) {
      console.log('🔌 Initializing socket connection for user:', userId);
      
      // Try multiple possible URLs for socket connection
      const envUrl = import.meta.env.VITE_API_URL;
      const fallbackUrl = 'http://localhost:5000';
      const originUrl = window.location.origin.replace(/:\d+$/, ':5000');
      const protocolUrl = window.location.protocol + '//' + window.location.hostname + ':5000';
      
      console.log('🔍 Environment VITE_API_URL:', envUrl);
      console.log('🔍 Fallback URL:', fallbackUrl);
      console.log('🔍 Origin URL:', originUrl);
      console.log('🔍 Protocol URL:', protocolUrl);
      console.log('🔍 Window location:', window.location.href);
      
      const possibleUrls = [envUrl, fallbackUrl, originUrl, protocolUrl].filter(Boolean);
      const socketUrl = possibleUrls[0] || fallbackUrl;
      
      console.log('🌐 Selected socket URL:', socketUrl);
      console.log('🔍 All possible URLs:', possibleUrls);
      
      // Test if the server is reachable before creating socket
      console.log('🔍 Testing server connectivity...');
      fetch(socketUrl + '/socket.io/')
        .then(response => {
          console.log('✅ Server Socket.IO endpoint reachable:', response.status);
        })
        .catch(error => {
          console.error('❌ Server Socket.IO endpoint not reachable:', error);
        });
      
      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
        timeout: 10000, // 10 second timeout
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        forceNew: true // Force a new connection
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✅ Connected to server with socket ID:', newSocket.id);
        setIsConnected(true);
        // Authenticate the user with the server
        newSocket.emit('authenticate', userId);
        console.log('🔐 Sent authentication for user:', userId);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server. Reason:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🚨 Connection error:', error.message);
        console.error('🚨 Error details:', error);
        setIsConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Reconnection attempt', attemptNumber);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('🚨 Reconnection error:', error);
      });

      // Handle online users updates
      newSocket.on('online_users', (users) => {
        setOnlineUsers(new Set(users));
      });

      // Handle test pong response
      newSocket.on('test_pong', (data) => {
        console.log('🏓 Received test pong from server:', data);
      });

      // Test connection by sending a ping
      setTimeout(() => {
        console.log('🔍 Socket connection test after 2 seconds:', {
          connected: newSocket.connected,
          id: newSocket.id,
          transport: newSocket.io?.engine?.transport?.name,
          readyState: newSocket.io?.engine?.readyState
        });
        
        if (newSocket.connected) {
          console.log('✅ Socket connection test: Connected');
          newSocket.emit('test_ping', { message: 'Hello from client', userId });
        } else {
          console.error('❌ Socket connection test: Failed to connect');
          console.error('❌ Socket connection details:', {
            url: socketUrl,
            options: {
              withCredentials: true,
              transports: ['websocket', 'polling'],
              timeout: 10000,
              reconnection: true,
              reconnectionAttempts: 5,
              reconnectionDelay: 1000,
              forceNew: true
            }
          });
        }
      }, 2000);

      return () => {
        console.log('🔌 Cleaning up socket connection');
        newSocket.disconnect();
      };
    } else {
      // Disconnect if no userId
      if (socket) {
        console.log('🔌 Disconnecting socket (no user ID)');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [userId]);

  const value = {
    socket,
    isConnected,
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};