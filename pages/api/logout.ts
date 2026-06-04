import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  res.setHeader('Set-Cookie', [
    serialize('admin_auth', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 0,
    }),
    serialize('patron_auth', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 0,
    }),
  ]);

  res.status(200).json({ ok: true });
}
