// pages/api/auth/check-2fa-status.js
import User from '../../../models/User';
import { sequelize } from '../../../config/database';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    await sequelize.sync();

    try {
      const token = req.headers['x-auth-token'];
      if (!token) {
        return res.status(401).json({ msg: 'No token provided' });
      }

      const userId = req.query.userId || req.body.userId;
      if (!userId) {
        return res.status(400).json({ msg: 'User ID is required' });
      }

      const user = await User.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const is2FAEnabled = !!user.is2FAEnabled;
      return res.status(200).json({ is2FAEnabled });
    } catch (error) {
      console.error('Error checking 2FA status:', error.message);
      return res.status(500).send('Server error');
    }
  } else {
    res.status(405).json({ msg: 'Method not allowed' });
  }
}
