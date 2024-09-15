import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded.user; // Attach user info to the request object

    next(); // Continue to the next middleware or route
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(403).json({ msg: 'Token is invalid or expired' });
  }
}
