import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import User from './../../models/User';

// Define handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get session from request
  const session = await getSession({ req });
  
  // If no session, return unauthorized error
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find the user by email (from the session)
    const user = await User.findOne({ where: { email: session.user?.email } });

    // If the user is not found, return a 404 error
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user's storage info
    return res.status(200).json({
      currentStorage: user.currentStorage,
      maxStorage: user.maxStorage,
    });
  } catch (error) {
    // Log and return server error
    console.error('Error fetching storage info:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
