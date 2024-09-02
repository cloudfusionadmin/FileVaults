// middleware/checkRole.js

const checkRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ msg: 'Access denied: Insufficient permissions' });
    }
    next();
  };
  
  module.exports = checkRole;
  