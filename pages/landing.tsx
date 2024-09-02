import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Landing.module.css';

export default function Landing() {
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');

    if (token && storedUsername) {
      setUsername(storedUsername);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Welcome to FileVaults Manager</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <nav className={styles.nav}>
          <h1 className={styles.logo}>File Vaults Manager</h1>
          <ul className={styles.navLinks}>
            {isAuthenticated ? (
              <>
                <li><Link href="/">Dashboard</Link></li>
                <li><Link href="/plans">Plans</Link></li>
                <li><Link href="/settings">Settings</Link></li>
                <li>
                  <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                </li>
              </>
            ) : (
              <>
                <li><Link href="/register">Sign Up</Link></li>
                <li><Link href="/login">Login</Link></li>
              </>
            )}
          </ul>
        </nav>
      </header>

      <main className={styles.main}>
        {/* Account Widget */}
        {isAuthenticated && (
          <div className={styles.accountWidget}>
            <h2>Welcome back, {username}!</h2>
            <p>Access your dashboard to manage your files.</p>
            <div className={styles.accountButtons}>
              <Link href="/">
                <button className={styles.dashboardButton}>Go to Dashboard</button>
              </Link>
              <Link href="/settings">
                <button className={styles.settingsButton}>Account Settings</button>
              </Link>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h2 className={styles.heroTitle}>Welcome to File Vaults Manager</h2>
            <p className={styles.heroSubtitle}>Securely manage your cloud files with ease.</p>
            <Link href="/register">
              <button className={styles.ctaButton}>Get Started</button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <h3 className={styles.sectionTitle}>Why Choose Us?</h3>
          <div className={styles.featureList}>
            <div className={styles.feature}>
              <img src="/icons/secure-storage.png" alt="Secure Storage" className={styles.featureIcon} />
              <h4>Secure Storage</h4>
              <p>Your files are protected with advanced encryption both in transit and at rest. 
                 With FileVaults, you’re in control—only you have access to your data. </p>
            </div>
            <div className={styles.feature}>
              <img src="/icons/access-anywhere.png" alt="Anywhere Access" className={styles.featureIcon} />
              <h4>Anywhere Access</h4>
              <p>Seamlessly access, share, and manage your files from any device, whether you’re in the office, at home, or on the go. 
                 Our user-friendly interface makes it simple to stay connected and in control.</p>
            </div>
            <div className={styles.feature}>
              <img src="/icons/easy-management.png" alt="Easy Management" className={styles.featureIcon} />
              <h4>Easy Management</h4>
              <p>Simple and intuitive file management system.</p>
            </div>
          </div>
        </section>

        {/* Registration and Login Section */}
        <section className={styles.authSection}>
          <h3 className={styles.sectionTitle}>Get Started with File Vaults Manager</h3>
          <p className={styles.authDescription}>Join us today to manage your cloud storage efficiently.</p>
          <div className={styles.authButtons}>
            <Link href="/register">
              <button className={styles.authButton}>Sign Up</button>
            </Link>
            <Link href="/login">
              <button className={styles.authButton}>Login</button>
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2024 SwiftInfoTech.com.au. All rights reserved.</p>
        <ul className={styles.footerLinks}>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/contact">Contact</Link></li>
          <li><Link href="/privacypolicy">Privacy Policy</Link></li>
        </ul>
      </footer>
    </div>
  );
}
