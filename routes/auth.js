const express = require('express');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');  // Ensure the middleware is required
const router = express.Router();

// Register a new user
// Status codes and error handling improvements for better debugging
// Ensure to log actual error messages in try-catch
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      let user = await User.findOne({ where: { email } });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Password hashing with error handling
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        username,
        email,
        password: hashedPassword,
      });

      const payload = {
        user: {
          id: user.id,
        },
      };

      // Generate JWT token and include a refresh token logic if needed
      jwt.sign(
        payload,
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error('Error creating user:', err.message);
      res.status(500).send('Server error');
    }
  }
);


// Login user
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // JWT payload
      const payload = {
        user: {
          id: user.id,
        },
      };

      // Generate JWT token and set HttpOnly cookie
      jwt.sign(
        payload,
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          
          // Set the token in HttpOnly cookie
          res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=3600`);

          res.json({ msg: 'Login successful' });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);


// Get current user's profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
