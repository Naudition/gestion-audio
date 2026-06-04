import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';

function isAdmin(req: NextApiRequest) {
  const cookies = parse(req.headers.cookie || '');
  return cookies.admin_auth === 'true' || cookies.patron_auth === 'true';
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ administrateur: isAdmin(req) });
}
