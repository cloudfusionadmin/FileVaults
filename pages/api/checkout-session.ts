import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
  });
  

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { session_id } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    // Retrieve session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Send relevant session details back to the client
    res.status(200).json({
      customer_email: session.customer_details?.email,
      subscription_status: session.status,
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
}
