import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import User from '../../models/User';

// Define handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract token from authorization headers
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify and decode the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { id: string };

    if (!decoded?.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Find the user by id (from the decoded token)
    const user = await User.findOne({ where: { id: decoded.id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return storage info
    return res.status(200).json({
      currentStorage: user.currentStorage,
      maxStorage: user.maxStorage,
    });
  } catch (error) {
    console.error('Error fetching storage info:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    return res.status(500).json({ error: 'Server error' });
  }
}
