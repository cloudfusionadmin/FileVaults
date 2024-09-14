// pages/api/auth/forgot-password.js
import { sequelize } from '../../../config/database';
import User from '../../../models/User';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ msg: 'Method not allowed' });
  }

  await sequelize.sync();

  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ msg: 'User with this email does not exist' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const resetPasswordExpires = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Manually set the base URL for local development
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'https://file-vaults-puce.vercel.app/' 
      : process.env.BASE_URL;

    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

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
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${resetUrl}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ msg: 'Password reset email sent' });
  } catch (err) {
    console.error('Error in forgot-password handler:', err.message);
    res.status(500).send('Server error');
  }
}
