import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

type DossierRow = {
  id: number;
  resident_name: string;
  ehpad: string;
  audio_name: string;
  magasin: string;
  date_appareillage: string;
  date_facturation: string;
  montant: number;
  statut: string;
  created_at: string;
  updated_at: string;
};

type StatusHistoryRow = {
  id: number;
  dossier_id: number;
  old_status: string;
  new_status: string;
  changed_at: string;
};

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'gestion-audio.db');

let db: SqlJsDatabase | null = null;

async function initDb() {
  if (!fs.existsSync(dbPath)) {
    db = null;
  }
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  });
  
  let data: Buffer | undefined;
  if (fs.existsSync(dbPath)) {
    data = fs.readFileSync(dbPath);
  }

  db = new SQL.Database(data);

  db.run(`
    CREATE TABLE IF NOT EXISTS dossiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_name TEXT NOT NULL,
      ehpad TEXT NOT NULL,
      audio_name TEXT NOT NULL,
      magasin TEXT NOT NULL,
      date_appareillage TEXT NOT NULL,
      date_facturation TEXT NOT NULL,
      montant REAL NOT NULL,
      statut TEXT NOT NULL DEFAULT 'En attente',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dossier_id INTEGER NOT NULL,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      FOREIGN KEY (dossier_id) REFERENCES dossiers(id)
    );
  `);

  saveDb();
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb first.');
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}


export type Dossier = {
  id: number;
  resident_name: string;
  ehpad: string;
  audio_name: string;
  magasin: string;
  date_appareillage: string;
  date_facturation: string;
  montant: number;
  statut: string;
  created_at: string;
  updated_at: string;
  history?: StatusHistory[];
};

export type StatusHistory = {
  id: number;
  dossier_id: number;
  old_status: string;
  new_status: string;
  changed_at: string;
};

export type DossierCreateInput = {
  resident_name: string;
  ehpad: string;
  audio_name: string;
  magasin: string;
  date_appareillage: string;
  date_facturation: string;
  montant: number;
};

export async function createDossier(data: DossierCreateInput): Promise<Dossier> {
  const database = getDb();
  const now = new Date().toISOString();

  const sql = `
    INSERT INTO dossiers (
      resident_name, ehpad, audio_name, magasin,
      date_appareillage, date_facturation, montant, statut,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'En attente', ?, ?)
  `;

  database.run(sql, [
    data.resident_name,
    data.ehpad,
    data.audio_name,
    data.magasin,
    data.date_appareillage,
    data.date_facturation,
    data.montant,
    now,
    now,
  ]);

  saveDb();

  // Query for the most recent dossier with matching audio_name and resident_name
  const result = database.exec(
    'SELECT * FROM dossiers WHERE audio_name = ? AND resident_name = ? ORDER BY id DESC LIMIT 1',
    [data.audio_name, data.resident_name]
  );

  if (!result[0] || result[0].values.length === 0) {
    throw new Error('Dossier créé mais impossible à récupérer');
  }

  const columns = result[0].columns as string[];
  const row = result[0].values[0] as any[];
  const obj: Record<string, any> = {};

  columns.forEach((col: string, i: number) => {
    obj[col] = row[i];
  });

  return obj as Dossier;
}

export function getDossierById(id: number): Dossier {
  const database = getDb();
  const result = database.exec('SELECT * FROM dossiers WHERE id = ?', [id]);

  if (!result[0] || result[0].values.length === 0) {
    throw new Error('Dossier introuvable');
  }

  const columns = result[0].columns as string[];
  const row = result[0].values[0] as any[];
  const obj: Record<string, any> = {};

  columns.forEach((col: string, i: number) => {
    obj[col] = row[i];
  });

  return obj as Dossier;
}

export function getHistory(dossierId: number): StatusHistory[] {
  const database = getDb();
  const result = database.exec(
    'SELECT * FROM status_history WHERE dossier_id = ? ORDER BY changed_at DESC',
    [dossierId]
  );

  if (!result[0]) return [];

  const columns = result[0].columns as string[];
  return result[0].values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj as StatusHistory;
  });
}

export function getDossiers(filters: {
  audio_name?: string;
  ehpad?: string;
  statut?: string;
  magasin?: string;
  startDate?: string;
  endDate?: string;
}, includeHistory = false): Dossier[] {
  const database = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.audio_name) {
    conditions.push('audio_name = ?');
    params.push(filters.audio_name);
  }
  if (filters.ehpad) {
    conditions.push('ehpad LIKE ?');
    params.push(`%${filters.ehpad}%`);
  }
  if (filters.statut) {
    conditions.push('statut = ?');
    params.push(filters.statut);
  }
  if (filters.magasin) {
    conditions.push('magasin LIKE ?');
    params.push(`%${filters.magasin}%`);
  }
  if (filters.startDate) {
    conditions.push('date_appareillage >= ?');
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push('date_appareillage <= ?');
    params.push(filters.endDate);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = database.exec(`SELECT * FROM dossiers ${whereClause} ORDER BY date_appareillage DESC`, params);

  if (!result[0]) return [];

  const columns = result[0].columns as string[];
  const dossiers = result[0].values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    const dossier = obj as Dossier;
    if (includeHistory) {
      dossier.history = getHistory(dossier.id);
    }
    return dossier;
  });

  return dossiers;
}

export function toggleDossierStatus(id: number, newStatus: string): Dossier {
  const database = getDb();
  const dossier = getDossierById(id);

  if (dossier.statut === newStatus) {
    return dossier;
  }

  const now = new Date().toISOString();
  database.run('UPDATE dossiers SET statut = ?, updated_at = ? WHERE id = ?', [newStatus, now, id]);

  database.run(
    'INSERT INTO status_history (dossier_id, old_status, new_status, changed_at) VALUES (?, ?, ?, ?)',
    [id, dossier.statut, newStatus, now]
  );

  saveDb();

  const updated = getDossierById(id);
  updated.history = getHistory(id);
  return updated;
}

export { initDb };
