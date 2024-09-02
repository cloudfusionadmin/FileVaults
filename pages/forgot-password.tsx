import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Auth.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Password reset link sent to your email.');
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Failed to send reset link.');
      }
    } catch (err) {
      setError('An error occurred while sending reset link.');
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Forgot Password - R2 Bucket Manager</title>
      </Head>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 className={styles.title}>Forgot Password</h2>
          <form onSubmit={handleForgotPassword} className={styles.form}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
            {message && <p className={styles.success}>{message}</p>}
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button}>
              Send Reset Link
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
