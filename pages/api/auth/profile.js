import User from '../../../models/User';
import auth from '../../../middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ msg: 'Method not allowed' });
  }

  try {
    // Execute the auth middleware, which verifies the token and sets req.user
    auth(req, res, async () => {
      console.log('Auth middleware executed');

      if (!req.user) {
        return res.status(401).json({ msg: 'Unauthorized: No user found in request' });
      }

      // Fetch user details using the ID from the token
      const user = await User.findOne({ where: { id: req.user.id } });

      if (!user) {
        console.log('User not found');
        return res.status(404).json({ msg: 'User not found' });
      }

      console.log('Fetched User Data:', user);

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

