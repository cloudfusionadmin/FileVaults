// pages/api/auth/register-intent.js
import { stripe } from 'your-stripe-setup-file'; // Adjust import as needed

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { plan } = req.body; // Get plan from request body

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: getPlanAmount(plan), // Implement this function based on your plans
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

function getPlanAmount(plan) {
  // Replace with actual plan amounts
  switch (plan) {
    case 'basic':
      return 500; // $5.00
    case 'standard':
      return 1000; // $10.00
    case 'premium':
      return 1500; // $15.00
    default:
      return 500; // Default to basic
  }
}
