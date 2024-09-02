// pages/api/auth/enable-2fa.js
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import User from '../../../models/User';
import { sequelize } from '../../../config/database';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await sequelize.sync();

    try {
      const { userId } = req.body;

      // Log userId to ensure it's correctly passed
      console.log('Received userId:', userId);

      if (!userId) {
        return res.status(400).json({ msg: 'User ID is required' });
      }

      let user = await User.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Generate and store the 2FA secret, then return the QR code
      const secret = authenticator.generateSecret();
      const otpauth = authenticator.keyuri(user.email, 'R2 Bucket Manager', secret);
      const qrCode = await qrcode.toDataURL(otpauth);

      user.twoFactorSecret = secret;
      user.is2FAEnabled = true; // Enable 2FA
      await user.save();

      console.log(`2FA secret generated for user ${user.username}: ${secret}`); // Log the secret

      res.status(200).json({ qrCode });
    } catch (err) {
      console.error('Error in 2FA enable handler:', err.message);
      res.status(500).send('Server error');
    }
  } else {
    res.status(405).json({ msg: 'Method not allowed' });
  }
}
