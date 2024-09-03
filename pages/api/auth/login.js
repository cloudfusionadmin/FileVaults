import { sequelize } from '../../../config/database';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Ensure the request method is POST, otherwise return 405
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('Request method:', req.method); // Log the request method

  await sequelize.sync(); // Ensure the database is synced

  const { email, password, twoFactorCode } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // If 2FA is enabled, handle the 2FA logic
    if (user.is2FAEnabled) {
      if (!twoFactorCode) {
        // Generate a 2FA code and send it via email
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

        // Save the hashed 2FA code and its expiry in the user's record
        const hashedCode = bcrypt.hashSync(twoFactorCodeGenerated, bcrypt.genSaltSync(10));
        user.temp2FACode = hashedCode;
        user.temp2FACodeExpiry = new Date(Date.now() + 5 * 60000); // Set expiry time to 5 minutes

        await user.save();

        return res.status(206).json({ msg: '2FA code sent to your email' });
      }

      // Check if the 2FA code is expired
      if (new Date() > user.temp2FACodeExpiry) {
        return res.status(400).json({ msg: '2FA code expired' });
      }

      // Verify the 2FA code
      const is2FACodeMatch = await bcrypt.compare(twoFactorCode, user.temp2FACode);
      if (!is2FACodeMatch) {
        return res.status(400).json({ msg: 'Invalid 2FA code' });
      }

      // Clear the temporary 2FA code and expiry after successful verification
      user.temp2FACode = null;
      user.temp2FACodeExpiry = null;
      await user.save();
    }

    // Create a JWT token
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET_KEY,
      { expiresIn: '15m' }, // Adjust the token expiry as needed
      (err, token) => {
        if (err) {
          console.error('JWT sign error:', err);
          return res.status(500).json({ msg: 'Token generation failed' });
        }
        return res.status(200).json({ token, userId: user.id, username: user.username });
      }
    );

  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
}
