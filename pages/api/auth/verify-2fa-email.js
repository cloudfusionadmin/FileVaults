// pages/api/auth/verify-2fa-email.js
import User from '../../../models/User';

export default async function handler(req, res) {
  const { userId, code } = req.body;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.temp2FACode === code) {
      user.temp2FACode = null; // Clear the code after verification
      await user.save();

      // Generate JWT token as before
      const payload = { user: { id: user.id } };
      jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '15m' }, (err, token) => {
        if (err) throw err;
        return res.status(200).json({ token, userId: user.id, username: user.username });
      });
    } else {
      return res.status(400).json({ msg: 'Invalid 2FA code' });
    }
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({ msg: 'Server error' });
  }
}
