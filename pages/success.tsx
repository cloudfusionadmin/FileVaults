import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Success.module.css'; // Create a new CSS module for custom styles

export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const [message, setMessage] = useState('Retrieving your session details...');
  const [countdown, setCountdown] = useState(5); // Countdown before redirection

  useEffect(() => {
    if (!session_id) return;

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/checkout-session?session_id=${session_id}`);
        const session = await response.json();

        if (session) {
          setMessage(`Thank you, ${session.customer_email}! Your subscription is active.`);
        } else {
          setMessage('Failed to retrieve session.');
        }
      } catch (error) {
        setMessage('An error occurred while fetching session details.');
      }
    };

    fetchSession();
  }, [session_id]);

  // Countdown timer for redirecting to login
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          router.push('/login');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Subscription Success - FileVaults</title>
      </Head>

      <div className={styles.successBox}>
        <h1 className={styles.title}>Success!</h1>
        <p className={styles.message}>{message}</p>
        <p className={styles.redirect}>You will be redirected to login in {countdown} seconds.</p>
        <button onClick={() => router.push('/login')} className={styles.loginButton}>
          Go to Login Now
        </button>
      </div>
    </div>
  );
}
