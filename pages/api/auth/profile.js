import User from '../../../models/User';
import auth from '../../../middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ msg: 'Method not allowed' });
  }

  try {
    // Call auth middleware to verify the token
    auth(req, res, async () => {
      if (!req.user) {
        console.error('No user found in request.');
        return res.status(401).json({ msg: 'Unauthorized: No user found in request' });
      }

      // Find user in the database
      const user = await User.findOne({ where: { id: req.user.id } });

      if (!user) {
        console.error(`User with ID ${req.user.id} not found.`);
        return res.status(404).json({ msg: 'User not found' });
      }

      // Send user profile information
      return res.status(200).json({
        email: user.email,
        username: user.username,
        is2FAEnabled: user.is2FAEnabled,
      });
    });
  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
}
