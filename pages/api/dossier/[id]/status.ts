import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { toggleDossierStatus, initDb } from '../../../../lib/db';

function isAdmin(req: NextApiRequest) {
  const cookies = parse(req.headers.cookie || '');
  return cookies.admin_auth === 'true' || cookies.patron_auth === 'true';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await initDb();

  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Accès refusé.' });
  }

  const {
    query: { id },
    method,
  } = req;

  if (method !== 'PATCH') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const status = req.body.status;
  if (status !== 'En attente' && status !== 'Payé') {
    return res.status(400).json({ error: 'Valeur de statut invalide' });
  }

  const dossier = toggleDossierStatus(Number(id), status);
  res.status(200).json(dossier);
}
