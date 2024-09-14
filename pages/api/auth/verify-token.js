import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ msg: 'Method not allowed' });
  }

  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token provided or incorrect format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return res.status(200).json({ user: decoded.user });
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
}
