import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import { authenticator } from 'otplib';

export default async function handler(req, res) {
  const { verificationCode, userId } = req.body;

  try {
    // Fetch the user from the database
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Verify the 2FA code against the stored secret
    const isValid = authenticator.verify({
      token: verificationCode,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      return res.status(400).json({ msg: 'Invalid 2FA code' });
    }

    // Generate a new JWT token if the 2FA code is valid
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET_KEY,
      { expiresIn: '15m' },
      (err, newToken) => {
        if (err) {
          return res.status(500).json({ msg: 'Error generating token' });
        }
        return res.status(200).json({ newToken });
      }
    );
  } catch (err) {
    console.error('Error verifying 2FA setup:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}
