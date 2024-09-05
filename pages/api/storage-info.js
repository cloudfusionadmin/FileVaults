import { getSession } from 'next-auth/client';
import User from '../../../models/User';

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await User.findOne({ where: { email: session.user.email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      currentStorage: user.currentStorage,
      maxStorage: user.maxStorage,
    });
  } catch (error) {
    console.error('Error fetching storage info:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
