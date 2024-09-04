// new endpoint: /api/auth/register-success.js

export default async function handler(req, res) {
    if (req.method === 'POST') {
      const { username, email, password, plan, customerId } = req.body;
  
      try {
        // Hash the user's password
        const hashedPassword = await bcrypt.hash(password, 10);
  
        // Create the user with the Stripe customer ID and plan
        const user = await User.create({
          username,
          email,
          password: hashedPassword,
          stripeCustomerId: customerId, // Save the Stripe customer ID
          plan, // Save the selected plan
        });
  
        const payload = {
          user: {
            id: user.id,
          },
        };
  
        jwt.sign(
          payload,
          process.env.JWT_SECRET_KEY,
          { expiresIn: '1h' },
          (err, token) => {
            if (err) throw err;
            res.status(200).json({ token });
          }
        );
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
      }
    } else {
      res.status(405).json({ msg: 'Method not allowed' });
    }
  }
  