// pages/api/auth/disable-2fa.js
import User from '../../../models/User';
import { sequelize } from '../../../config/database';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await sequelize.sync();

    try {
      const { userId } = req.body; // Ensure userId is extracted from the request body

      if (!userId) {
        return res.status(400).json({ msg: 'User ID is required' });
      }

      const user = await User.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      user.twoFactorSecret = null;
      user.is2FAEnabled = false;
      await user.save();

      return res.status(200).json({ msg: '2FA has been disabled' });
    } catch (error) {
      console.error('Error disabling 2FA:', error.message);
      return res.status(500).send('Server error');
    }
  } else {
    res.status(405).json({ msg: 'Method not allowed' });
  }
}
