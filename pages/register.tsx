import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import styles from '../styles/Auth.module.css';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function RegisterForm({ clientSecret, setClientSecret, setCustomerId }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState('basic');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    const queryPlan = router.query.plan;
    if (queryPlan) {
      setPlan(queryPlan as string);
    }
  }, [router.query]);

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet.');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Fetch clientSecret from backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, plan }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.msg || 'Failed to start registration.');
        setLoading(false);
        return;
      }

      const { clientSecret, customerId } = await response.json();
      setClientSecret(clientSecret);
      setCustomerId(customerId);

      // Step 2: Confirm the payment using Stripe
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/login`,
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // Step 3: Complete registration with the backend after successful payment
      const userResponse = await fetch('/api/auth/register-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, plan, customerId }),
      });

      if (!userResponse.ok) {
        const userError = await userResponse.json();
        setError(userError.msg || 'Failed to complete registration.');
        setLoading(false);
        return;
      }

      router.push('/login');
    } catch (err) {
      setError('An error occurred during registration.');
      setLoading(false);
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
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className={styles.input}>
              <option value="basic">Basic Plan</option>
              <option value="standard">Standard Plan</option>
              <option value="premium">Premium Plan</option>
            </select>

            {loading && <p>Loading payment information...</p>}
            {clientSecret && <PaymentElement className={styles.input} />}
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Processing...' : 'Sign Up'}
            </button>
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
  const [clientSecret, setClientSecret] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the clientSecret when the component mounts
    const fetchClientSecret = async () => {
      try {
        const response = await fetch('/api/auth/register-intent');
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error('Failed to fetch client secret:', error);
      }
    };

    fetchClientSecret();
  }, []);

  return (
    <>
      {loading && <p>Loading...</p>}
      {!loading && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <RegisterForm clientSecret={clientSecret} setClientSecret={setClientSecret} setCustomerId={setCustomerId} />
        </Elements>
      )}
      {!loading && !clientSecret && <p>Failed to load payment information. Please try again later.</p>}
    </>
  );
}
