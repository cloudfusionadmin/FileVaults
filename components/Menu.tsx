// components/Menu.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaSignOutAlt } from 'react-icons/fa';
import styles from '../styles/Menu.module.css';

export default function Menu({ username }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    router.push('/login');
  };

  return (
    <nav className={styles.nav}>
      <h1 className={styles.logo}>R2 Bucket Manager</h1>
      {username && <span className={styles.username}>Hello, {username}</span>}
      <Link href="/landing" className={styles.link}>Home</Link>
      <Link href="/settings" className={styles.link}>Settings</Link>
      <button onClick={handleLogout} className={styles.logoutButton}>
        <FaSignOutAlt /> Logout
      </button>
    </nav>
  );
}
