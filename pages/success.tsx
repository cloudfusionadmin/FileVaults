import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!session_id) return;

    const fetchSession = async () => {
      const response = await fetch(`/api/checkout-session?session_id=${session_id}`);
      const session = await response.json();

      if (session) {
        setMessage(`Thank you, ${session.customer_email}! Your subscription is active.`);
      } else {
        setMessage('Failed to retrieve session.');
      }
    };

    fetchSession();
  }, [session_id]);

  return (
    <div>
      <h1>Success</h1>
      <p>{message}</p>
    </div>
  );
}
