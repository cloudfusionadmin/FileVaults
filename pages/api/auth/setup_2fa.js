// pages/api/auth/setup-2fa.js

import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { sequelize } from '../../../config/database';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await sequelize.sync();
      const { userId } = req.body;

      const user = await User.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const secret = speakeasy.generateSecret({
        name: 'R2 Bucket Manager',
        length: 20,
      });

      const url = speakeasy.otpauthURL({
        secret: secret.ascii,
        label: `${user.username}@R2BucketManager`,
        issuer: 'R2 Bucket Manager',
      });

      const qrCode = await qrcode.toDataURL(url);

      // Save the secret in the database
      user.twoFactorSecret = secret.base32;
      await user.save();

      res.status(200).json({ qrCode });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  } else {
    res.status(405).json({ msg: 'Method not allowed' });
  }
}
