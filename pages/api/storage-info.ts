import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import User from '../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Extract token from authorization headers
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from Bearer scheme

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Token missing.' });
    }

    let decoded;
    try {
      // Verify and decode the JWT token
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { user: { id: string } };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please log in again.' });
      }
      return res.status(403).json({ error: 'Invalid token. Please log in again.' });
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

    // Return storage info
    return res.status(200).json({
      currentStorage: user.currentStorage,
      maxStorage: user.maxStorage,
    });
  } catch (error) {
    console.error('Error fetching storage info:', error.message);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
}
