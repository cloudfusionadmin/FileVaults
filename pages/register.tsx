// pages/register.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import styles from '../styles/Auth.module.css';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState('basic'); // Default plan selection
  const [error, setError] = useState('');
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    // Pre-select the plan from query parameters if present
    const queryPlan = router.query.plan;
    if (queryPlan) {
      setPlan(queryPlan as string);
    }
  }, [router.query]);

  const handleRegister = async (event) => {
    event.preventDefault();

    try {
      const cardElement = elements.getElement(CardElement);

      // Create a payment method using Stripe
      const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email,
        },
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message);
        return;
      }

      // Call the backend API to register the user and create a subscription
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, plan, paymentMethodId: paymentMethod.id }),
      });

      if (response.ok) {
        router.push('/login'); // Redirect to login after successful registration
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration.');
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Register - File Vaults Manager</title>
      </Head>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 className={styles.title}>Create Your Account</h2>
          <form onSubmit={handleRegister} className={styles.form}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
            {/* Plan selection dropdown */}
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className={styles.input}>
              <option value="basic">Basic Plan</option>
              <option value="standard">Standard Plan</option>
              <option value="premium">Premium Plan</option>
            </select>
            {/* Add Stripe CardElement for payment information */}
            <CardElement className={styles.input} />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button}>Sign Up</button>
          </form>
          <p className={styles.text}>
            Already have an account? <Link href="/login">Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Elements stripe={stripePromise}>
      <RegisterForm />
    </Elements>
  );
}
