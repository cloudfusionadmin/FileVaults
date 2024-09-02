import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  const authHeader = req.headers['authorization']; // Get the Authorization header

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token provided or incorrect format' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY, { ignoreExpiration: true });
    const payload = { user: { id: decoded.user.id } };

    // Generate a new token with a new expiry time
    const newToken = jwt.sign(
      payload,
      process.env.JWT_SECRET_KEY,
      { expiresIn: '15m' }
    );

    res.status(200).json({ token: newToken });
  } catch (err) {
    console.error('Error refreshing token:', err.message);
    res.status(403).json({ msg: 'Token is not valid' });
  }
}

