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

      // Create a new Stripe customer
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

      // Hash the password before saving to the database
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create the user in the database
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        plan,
        stripeCustomerId: customer.id,  // Save the Stripe customer ID
      });

      // Send success response
      res.status(200).json({ msg: 'User registered and payment successful', clientSecret: paymentIntent.client_secret });

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
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

// Helper function to get the amount based on the plan (in cents)
function getPriceAmount(plan) {
  switch (plan) {
    case 'standard':
      return 1000; // in cents
    case 'premium':
      return 2000; // in cents
    case 'basic':
    default:
      return 500;  // in cents
  }
}
