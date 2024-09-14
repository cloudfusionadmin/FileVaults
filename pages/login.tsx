import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Auth.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [is2FARequired, setIs2FARequired] = useState(false);
  const router = useRouter();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, twoFactorCode: is2FARequired ? twoFactorCode : null }),
      });

      if (response.status === 206) {
        setIs2FARequired(true);
      } else if (response.ok) {
        // After login, redirect to dashboard (no need to handle token here as it's in cookies)
        router.push('/');
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Login - File Vaults Manager</title>
      </Head>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 className={styles.title}>Login to Your Account</h2>
          <form onSubmit={handleLogin} className={styles.form}>
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
            {is2FARequired && (
              <input
                type="text"
                placeholder="Enter 2FA Code"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                required
                className={styles.input}
              />
            )}
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button}>
              {is2FARequired ? 'Verify 2FA & Login' : 'Login'}
            </button>
          </form>
          <p className={styles.text}>
            <Link href="/forgot-password">Forgot Password?</Link>
          </p>
          <p className={styles.text}>
            Don’t have an account? <Link href="/register">Sign Up</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
