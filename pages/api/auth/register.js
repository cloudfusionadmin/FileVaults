import { sequelize } from '../../../config/database';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await sequelize.sync();

    const { username, email, password, plan } = req.body;

    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create the user in the database with the selected plan
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        plan, // Save the selected plan
        maxStorage: getStorageLimit(plan), // Set the storage limit based on the plan
      });

      // Create Stripe Checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: getPriceId(plan),
            quantity: 1,
          },
        ],
        customer_email: email,
        success_url: `${process.env.DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.DOMAIN}/cancel`,
      });

      // Send sessionId back to the frontend
      res.status(200).json({ sessionId: session.id });
    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ error: 'Server error: ' + err.message });
    }
  } else {
    res.status(405).json({ msg: 'Method not allowed' });
  }
}

// Helper function to get Stripe price ID based on the plan
function getPriceId(plan) {
  switch (plan) {
    case 'standard':
      return process.env.STRIPE_STANDARD_PRICE_ID;
    case 'premium':
      return process.env.STRIPE_PREMIUM_PRICE_ID;
    case 'basic':
    default:
      return process.env.STRIPE_BASIC_PRICE_ID;
  }
}

// Helper function to get the storage limit based on the plan
function getStorageLimit(plan) {
  switch (plan) {
    case 'standard':
      return 250 * 1024 * 1024 * 1024; // 250 GB
    case 'premium':
      return 1000 * 1024 * 1024 * 1024; // 1000 GB
    case 'basic':
    default:
      return 100 * 1024 * 1024 * 1024; // 100 GB
  }
}
