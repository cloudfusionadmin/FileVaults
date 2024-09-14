import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import { refreshToken } from '../../utils/auth'; 

// Define storage quotas for each plan
const planStorageMap = {
  basic: 100 * 1024 * 1024 * 1024, // 100 GB in bytes
  standard: 250 * 1024 * 1024 * 1024, // 250 GB in bytes
  premium: 1024 * 1024 * 1024 * 1024, // 1 TB in bytes
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized. Authorization header missing.' });
    }

    let token = authHeader.split(' ')[1];
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

    // Get the plan and fetch max storage based on the user's plan
    const plan = user.plan || 'basic'; // Default to 'basic' plan if not set
    const maxStorage = planStorageMap[plan] || 107374182400; // Use the plan to set the correct maxStorage

    const currentStorage = user.currentStorage || 0;

    return res.status(200).json({
      currentStorage,
      maxStorage,
      ...(newToken ? { token: newToken } : {}), // Send new token if refreshed
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
}
