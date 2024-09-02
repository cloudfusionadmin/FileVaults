// pages/reset-password.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Auth.module.css';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { token } = router.query;

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      if (response.ok) {
        setSuccess('Password has been reset successfully.');
        setTimeout(() => {
          router.push('/login');
        }, 2000); // Redirect to login after 2 seconds
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred during password reset.');
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Reset Password - R2 Bucket Manager</title>
      </Head>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 className={styles.title}>Reset Your Password</h2>
          <form onSubmit={handleResetPassword} className={styles.form}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={styles.input}
            />
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}
            <button type="submit" className={styles.button}>
              Reset Password
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
