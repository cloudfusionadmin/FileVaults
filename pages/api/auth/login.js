import { sequelize } from '../../../config/database';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await sequelize.sync(); // Ensure database sync

  const { email, password, twoFactorCode } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Handle 2FA if enabled
    if (user.is2FAEnabled) {
      if (!twoFactorCode) {
        const twoFactorCodeGenerated = Math.floor(100000 + Math.random() * 900000).toString();

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });

        const mailOptions = {
          from: process.env.SMTP_FROM_EMAIL,
          to: user.email,
          subject: 'Your 2FA Code',
          text: `Your 2FA code is ${twoFactorCodeGenerated}`,
        };

        await transporter.sendMail(mailOptions);

        const hashedCode = bcrypt.hashSync(twoFactorCodeGenerated, bcrypt.genSaltSync(10));
        user.temp2FACode = hashedCode;
        user.temp2FACodeExpiry = new Date(Date.now() + 5 * 60000); // 5 minutes expiry
        await user.save();

        return res.status(206).json({ msg: '2FA code sent to your email' });
      }

      if (new Date() > user.temp2FACodeExpiry) {
        return res.status(400).json({ msg: '2FA code expired' });
      }

      const is2FACodeMatch = await bcrypt.compare(twoFactorCode, user.temp2FACode);
      if (!is2FACodeMatch) {
        return res.status(400).json({ msg: 'Invalid 2FA code' });
      }

      user.temp2FACode = null;
      user.temp2FACodeExpiry = null;
      await user.save();
    }

    // Create a JWT token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });

    // Set the token in an httpOnly cookie
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; Path=/index.tsx; SameSite=Strict; Max-Age=900`);

    return res.status(200).json({ userId: user.id, username: user.username });
  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
}
