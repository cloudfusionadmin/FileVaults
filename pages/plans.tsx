// pages/plans.tsx

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Container, Grid, Card, CardContent, Typography, Button, Box } from '@mui/material';
import styles from '../styles/Dashboard.module.css';

const plans = [
  {
    title: 'Basic',
    price: '$5.50/month',
    features: [
      '100 GB Storage',
      'Basic Support',
      '1 User',
    ],
    backgroundColor: '#f5f5f5',
  },
  {
    title: 'Standard',
    price: '$8.25/month',
    features: [
      '250 GB Storage',
      'Standard Support',
      '5 Users',
    ],
    backgroundColor: '#e0f7fa',
  },
  {
    title: 'Premium',
    price: '$13.2/month',
    features: [
      '1 TB Storage',
      'Premium Support',
      'Unlimited Users',
    ],
    backgroundColor: '#fce4ec',
  },
];

export default function Plans() {
  const router = useRouter();

  const handleLogout = () => {
    // Handle logout functionality
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    router.push('/login');
  };

  const handleChoosePlan = (plan: string) => {
    router.push(`/register?plan=${plan}`);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Plans - File Vaults Manager</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <nav className={styles.nav}>
          <h1 className={styles.logo}>File Vaults Manager</h1>
          <ul className={styles.navLinks}>
            <li><Link href="/">Dashboard</Link></li>
            <li><Link href="/plans">Plans</Link></li>
            <li><Link href="/settings">Settings</Link></li>
            <li>
              <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
            </li>
          </ul>
        </nav>
      </header>

      <Container maxWidth="lg" style={{ marginTop: '4rem', paddingBottom: '4rem' }}>
        <Typography variant="h3" align="center" gutterBottom>
          Choose Your Plan
        </Typography>
        <Grid container spacing={6} justifyContent="center">
          {plans.map((plan, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                elevation={3}
                style={{
                  backgroundColor: plan.backgroundColor,
                  borderRadius: '16px',
                  transition: 'transform 0.3s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <CardContent>
                  <Box textAlign="center" mb={3}>
                    <Typography variant="h5" component="div" gutterBottom>
                      {plan.title}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {plan.price}
                    </Typography>
                  </Box>
                  <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                    {plan.features.map((feature, i) => (
                      <li key={i}>
                        <Typography variant="body2" align="center">{feature}</Typography>
                      </li>
                    ))}
                  </ul>
                  <Box mt={4} textAlign="center">
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="large" 
                      onClick={() => handleChoosePlan(plan.title.toLowerCase())}
                    >
                      Choose {plan.title}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </div>
  );
}
