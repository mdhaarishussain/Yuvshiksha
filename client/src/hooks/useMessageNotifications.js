import { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
<<<<<<< HEAD
import { getFromLocalStorage } from '../utils/storage';
=======
>>>>>>> origin/main

export const useMessageNotifications = () => {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
<<<<<<< HEAD
      const user = getFromLocalStorage('currentUser');
      if (!user) {
=======
      const token = localStorage.getItem('token');
      if (!token) {
>>>>>>> origin/main
        setUnreadMessageCount(0);
        setLoading(false);
        return;
      }
<<<<<<< HEAD
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/messages/unread-count`,
        {
          withCredentials: true // CRITICAL FIX: This is what sends the HttpOnly cookie
=======

      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/messages/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` }
>>>>>>> origin/main
        }
      );

      setUnreadMessageCount(response.data.unreadCount || 0);
    } catch (error) {
<<<<<<< HEAD
      console.error('Error fetching unread message count:', error.response?.status, error.response?.data);
=======
      console.error('Error fetching unread message count:', error);
>>>>>>> origin/main
      setUnreadMessageCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
<<<<<<< HEAD
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    unreadMessageCount,
    loading,
    refreshUnreadCount: fetchUnreadCount
  };
};
=======
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { 
    unreadMessageCount, 
    loading, 
    refreshUnreadCount: fetchUnreadCount 
  };
};

>>>>>>> origin/main
