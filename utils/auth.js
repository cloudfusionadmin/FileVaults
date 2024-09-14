export const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Ensures cookies are sent with the request
    });

    if (response.ok) {
      // No need to store the token, as it's now stored as an httpOnly cookie
      return true;
    } else {
      console.error('Failed to refresh token');
      return null;
    }
  } catch (err) {
    console.error('Error refreshing token:', err);
    return null;
  }
};
