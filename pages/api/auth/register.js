import { sequelize } from '../../../config/database';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await sequelize.sync();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, plan, paymentMethodId } = req.body;

    try {
      let user = await User.findOne({ where: { email } });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email,
        name: username,
      });

      // Get the price ID based on the selected plan
      const priceId = getPriceId(plan);

      // Create a subscription for the customer
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        default_payment_method: paymentMethodId, // From frontend
        expand: ['latest_invoice.payment_intent'],
      });

      const clientSecret = subscription.latest_invoice.payment_intent.client_secret;

      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        username,
        email,
        password: hashedPassword,
        stripeCustomerId: customer.id, // Save the Stripe customer ID
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
          res.status(200).json({ clientSecret, token }); // Send the clientSecret and token to the frontend
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
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
