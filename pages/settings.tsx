import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Settings.module.css';

export default function Settings() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Fetch the current user profile when the component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/profile', {
          method: 'GET',
          headers: {
            'x-auth-token': token,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEmail(data.email);
          setUsername(data.username);
          setIs2FAEnabled(data.is2FAEnabled);
        } else {
          console.error('Failed to fetch user profile');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleEnable2FA = async () => {
    try {
      const userId = localStorage.getItem('userId');

      const response = await fetch('/api/auth/enable-2fa', {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const { qrCode } = await response.json();
        setQrCode(qrCode);
        setIs2FAEnabled(true); // Update the state to reflect 2FA is enabled
      } else {
        console.error('Failed to enable 2FA');
      }
    } catch (err) {
      console.error('Error enabling 2FA:', err);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const userId = localStorage.getItem('userId');

      const response = await fetch('/api/auth/disable-2fa', {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setSuccess('2FA has been successfully disabled.');
        setIs2FAEnabled(false); // Update the state to reflect 2FA is disabled
        setQrCode('');
      } else {
        const data = await response.json();
        setError(data.msg || 'Failed to disable 2FA.');
      }
    } catch (err) {
      console.error('Error disabling 2FA:', err);
    }
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId');

      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, email, username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Profile updated successfully.');
        localStorage.setItem('email', data.email);
        localStorage.setItem('username', data.username);
      } else {
        const data = await response.json();
        setError(data.msg || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An error occurred while updating profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Settings - File Vaults Manager</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Account Settings</h1>

        <div className={styles.card}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>New Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Leave blank to keep current password"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveChanges}
            className={styles.saveButton}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>

          <h2 className={styles.sectionTitle}>Two-Factor Authentication (2FA)</h2>
          <div className={styles.formGroup}>
            {is2FAEnabled ? (
              <>
                <p className={styles.successText}>2FA is currently enabled.</p>
                <button 
                  type="button" 
                  onClick={handleDisable2FA} 
                  className={styles.button}
                  disabled={!is2FAEnabled} // Disable if 2FA is already disabled
                >
                  Disable 2FA
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button" 
                  onClick={handleEnable2FA} 
                  className={styles.button}
                  disabled={is2FAEnabled} // Disable if 2FA is already enabled
                >
                  Enable 2FA
                </button>
              </>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.push('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
