import API_CONFIG from '../config/api';

// Function to decode JWT token and extract user ID
export const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Function to get user ID from various sources
export const getUserId = async () => {
  // Try to get from current user object first
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (currentUser._id || currentUser.id || currentUser.userId) {
    return currentUser._id || currentUser.id || currentUser.userId;
  }

  // Try to decode from JWT token
  const token = localStorage.getItem('token');
  if (token) {
    const decoded = decodeJWT(token);
    console.log('🔍 Decoded JWT:', decoded);
    
    if (decoded) {
      // Common JWT fields for user ID
      const possibleIdFields = ['_id', 'id', 'userId', 'user_id', 'sub', 'uid'];
      for (const field of possibleIdFields) {
        if (decoded[field]) {
          console.log('✅ Found user ID in JWT:', field, '=', decoded[field]);
          return decoded[field];
        }
      }
    }
  }

  // Try to fetch from backend profile
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/profile/student`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const profileData = await response.json();
      console.log('✅ Got profile data from backend:', profileData);
      
      const userId = profileData._id || profileData.id || profileData.userId;
      if (userId) {
        // Update localStorage with the complete user data including ID
        const updatedUser = { ...currentUser, ...profileData };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        console.log('✅ Updated localStorage with user ID:', userId);
        return userId;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
  }

  console.error('❌ Could not find user ID from any source');
  return null;
};

