import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import { refreshToken } from '../../utils/auth'; // Import refreshToken utility

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Extract token from authorization headers
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Extract token from Bearer scheme

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Token missing.' });
    }

    let decoded;
    let newToken: string | null = null;
    try {
      // Verify and decode the JWT token
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { user: { id: string } };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Try to refresh the token
        newToken = await refreshToken();
        if (!newToken) {
          return res.status(403).json({ error: 'Token expired and refresh failed.' });
        }
        // Use the new token for this request
        token = newToken;
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { user: { id: string } }; // Verify the new token
      } else {
        return res.status(403).json({ error: 'Invalid token. Please log in again.' });
      }
    }

    // Ensure that the decoded token contains the user ID
    if (!decoded?.user?.id) {
      return res.status(401).json({ error: 'Invalid token payload.' });
    }

    // Find the user by the decoded token's ID
    const user = await User.findOne({ where: { id: decoded.user.id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Ensure user's maxStorage and currentStorage values are valid
    const maxStorage = user.maxStorage || 100 * 1024 * 1024 * 1024; // Default to 100GB if not set (convert to bytes)
    const currentStorage = user.currentStorage || 0;

    // Return storage info along with a refreshed token if necessary
    return res.status(200).json({
      currentStorage,
      maxStorage,
      ...(newToken ? { token: newToken } : {}), // Send the new token back to the client if it was refreshed
    });
  } catch (error) {
    console.error('Error fetching storage info:', error.message);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
}
