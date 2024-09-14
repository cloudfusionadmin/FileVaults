import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ msg: 'Method not allowed' });
  }

  // Clear the HttpOnly cookie by setting it with Max-Age=0
  res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');

  // Optionally, return a success message
  return res.status(200).json({ msg: 'Logged out successfully' });
}
