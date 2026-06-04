import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { createDossier, getDossiers, initDb } from '../../lib/db';

function isAdmin(req: NextApiRequest) {
  const cookies = parse(req.headers.cookie || '');
  return cookies.admin_auth === 'true' || cookies.patron_auth === 'true';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await initDb();
  const administrateur = isAdmin(req);

  if (req.method === 'GET') {
    const { audioName, ehpad, statut, magasin, startDate, endDate } = req.query;

    if (!administrateur && !audioName) {
      return res.status(400).json({ error: "Le nom de l'audioprothésiste est requis pour l'accès libre." });
    }

    const filters = {
      audio_name: typeof audioName === 'string' ? audioName : undefined,
      ehpad: typeof ehpad === 'string' ? ehpad : undefined,
      statut: typeof statut === 'string' ? statut : undefined,
      magasin: typeof magasin === 'string' ? magasin : undefined,
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
    };

    const dossiers = getDossiers(filters, administrateur);
    const response = administrateur
      ? dossiers
      : dossiers.map((dossier) => ({ ...dossier, statut: undefined, history: undefined }));

    return res.status(200).json(response);
  }

  if (req.method === 'POST') {
    const { resident_name, ehpad, audio_name, magasin, date_appareillage, date_facturation, montant } = req.body;
    if (!resident_name || !ehpad || !audio_name || !magasin || !date_appareillage || !date_facturation || !montant) {
      return res.status(400).json({ error: 'Tous les champs du dossier sont obligatoires.' });
    }

    const dossier = await createDossier({
      resident_name,
      ehpad,
      audio_name,
      magasin,
      date_appareillage,
      date_facturation,
      montant: Number(montant),
    });

    return res.status(201).json(administrateur ? dossier : { ...dossier, statut: undefined });
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
