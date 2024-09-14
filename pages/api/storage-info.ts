import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import { refreshToken } from '../../utils/auth'; // Import refreshToken utility

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      console.error('Authorization header missing.');
      return res.status(401).json({ error: 'Unauthorized. Authorization header missing.' });
    }

    // Extract the token from the Authorization header
    let token = authHeader.split(' ')[1];
    if (!token) {
      console.error('Token missing in Authorization header.');
      return res.status(401).json({ error: 'Unauthorized. Token missing.' });
    }

    let decoded;
    let newToken: string | null = null;

    try {
      // Verify the token
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { user: { id: string } };
    } catch (error) {
      console.error('Token verification failed:', error.message);

      // Handle expired token by attempting to refresh it
      if (error.name === 'TokenExpiredError') {
        newToken = await refreshToken();
        if (!newToken) {
          console.error('Token expired and refresh failed.');
          return res.status(403).json({ error: 'Token expired and refresh failed.' });
        }

        // Re-verify the new token
        token = newToken;
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { user: { id: string } };
      } else {
        return res.status(403).json({ error: 'Invalid token. Please log in again.' });
      }
    }

    // Check if the decoded token contains user info
    if (!decoded?.user?.id) {
      console.error('Invalid token payload.');
      return res.status(401).json({ error: 'Invalid token payload.' });
    }

    // Fetch the user from the database
    const user = await User.findOne({ where: { id: decoded.user.id } });

    if (!user) {
      console.error('User not found.');
      return res.status(404).json({ error: 'User not found.' });
    }

    // Ensure values are valid and non-null
    const currentStorage = user.currentStorage || 0;
    const maxStorage = user.maxStorage || 107374182400; // Default to 100GB if not set

    // Return storage info along with a refreshed token if necessary
    return res.status(200).json({
      currentStorage,
      maxStorage,
      ...(newToken ? { token: newToken } : {}), // Send new token if refreshed
    });
  } catch (error) {
    console.error('Error fetching storage info:', error.message);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
}
