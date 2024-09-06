import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import { refreshToken } from '../../utils/auth'; // Import refreshToken utility

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Token missing.' });
    }

    let decoded;
    let newToken: string | null = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { user: { id: string } };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        newToken = await refreshToken();
        if (!newToken) {
          return res.status(403).json({ error: 'Token expired and refresh failed.' });
        }
        token = newToken;
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { user: { id: string } };
      } else {
        return res.status(403).json({ error: 'Invalid token. Please log in again.' });
      }
    }

    if (!decoded?.user?.id) {
      return res.status(401).json({ error: 'Invalid token payload.' });
    }

    const user = await User.findOne({ where: { id: decoded.user.id } });

    if (!user) {
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

