// utils/auth.js
export const refreshToken = async () => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No token found to refresh');
      return null;
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Send the token in the Authorization header
      }
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token); // Save the new token
      return data.token;
    } else {
      console.error('Failed to refresh token');
      return null;
    }
  } catch (err) {
    console.error('Error refreshing token:', err);
    return null;
  }
};
