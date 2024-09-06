import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // Verify token
    req.user = decoded.user; // Store user information in request object
    next(); // Proceed to next middleware or route handler
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
}
