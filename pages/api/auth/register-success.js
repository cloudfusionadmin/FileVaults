import { sequelize } from '../../../config/database';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
//import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
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

    const { username, email, password, plan } = req.body;

    try {
      // Check if the user already exists
      let existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email,
        name: username,
      });

      // Get the price ID and amount based on the selected plan
      const priceId = getPriceId(plan);
      const amount = getPriceAmount(plan);

      // Create a PaymentIntent for the subscription
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'aud',
        customer: customer.id,
        setup_future_usage: 'off_session',
      });

      const clientSecret = paymentIntent.client_secret;

      // Send the clientSecret and customerId to the frontend for payment confirmation
      res.status(200).json({ clientSecret, customerId: customer.id });

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ msg: 'Method not allowed' });
  }
}

export const registerSuccessHandler = async (req, res) => {
  if (req.method === 'POST') {
    await sequelize.sync();

    const { username, email, password, plan, customerId } = req.body;

    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create the user in the database
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        plan,
        stripeCustomerId: customerId,
      });

      res.status(200).json({ msg: 'User registered successfully' });

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ msg: 'Method not allowed' });
  }
};

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

// Helper function to get the amount based on the plan (in cents)
function getPriceAmount(plan) {
  switch (plan) {
    case 'standard':
      return 1000;
    case 'premium':
      return 2000;
    case 'basic':
    default:
      return 500;
  }
}
