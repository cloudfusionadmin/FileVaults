import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import { refreshToken } from '../../utils/auth';

// Define storage quotas for each plan
const planStorageMap = {
  basic: { quotaGB: 100, bytes: 100 * 1024 * 1024 * 1024 }, // 100 GB in bytes
  standard: { quotaGB: 250, bytes: 250 * 1024 * 1024 * 1024 }, // 250 GB in bytes
  premium: { quotaGB: 1024, bytes: 1024 * 1024 * 1024 * 1024 }, // 1 TB in bytes
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
        // Handle token refresh logic
        const refreshedToken = await refreshToken();
        if (typeof refreshedToken === 'string') {
          newToken = refreshedToken;
          token = newToken;
          decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { user: { id: string } };
        } else {
          return res.status(403).json({ error: 'Token expired and refresh failed.' });
        }
      } else {
        return res.status(403).json({ error: 'Invalid token. Please log in again.' });
      }
    }

    if (!decoded?.user?.id) {
      return res.status(401).json({ error: 'Invalid token payload.' });
    }

    // Fetch user from the database
    const user = await User.findOne({ where: { id: decoded.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get the plan and corresponding storage
    const plan = user.plan || 'basic';
    const storageQuota = planStorageMap[plan];

    // Update storage_quota_gb and maxStorage if necessary
    if (user.storage_quota_gb !== storageQuota.quotaGB) {
      user.storage_quota_gb = storageQuota.quotaGB;
      user.maxStorage = storageQuota.bytes;
      await user.save(); // Save changes in the database
    }

    const currentStorage = user.currentStorage || 0;

    // Return storage info
    return res.status(200).json({
      currentStorage,
      maxStorage: user.maxStorage,
      storageQuotaGB: user.storage_quota_gb,
      ...(newToken ? { token: newToken } : {}),
    });
  } catch (error) {
    console.error('Error fetching storage info:', error);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
}
