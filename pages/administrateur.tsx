import { useEffect, useMemo, useState, type FormEvent } from 'react';

type Dossier = {
  id: number;
  resident_name: string;
  ehpad: string;
  audio_name: string;
  magasin: string;
  date_appareillage: string;
  date_facturation: string;
  montant: number;
  statut: string;
  history?: { id: number; old_status: string; new_status: string; changed_at: string }[];
};

const STATUT_OPTIONS = ['', 'En attente', 'Payé'];

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [filters, setFilters] = useState({
    audioName: '',
    ehpad: '',
    statut: '',
    magasin: '',
    startDate: '',
    endDate: '',
  });
  const [historyOpenId, setHistoryOpenId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/login-status')
      .then((res) => res.json())
      .then((data) => {
        setLoggedIn(Boolean(data.administrateur));
        if (data.administrateur) {
          loadDossiers();
        }
      });
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    setLoading(false);
    if (!response.ok) {
      const error = await response.json();
      setMessage(error.error || 'Connexion impossible.');
      return;
    }

    setLoggedIn(true);
    setPassword('');
    loadDossiers();
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    setLoggedIn(false);
    setDossiers([]);
    setMessage('Déconnecté.');
  }

  async function loadDossiers() {
    const params = new URLSearchParams();
    if (filters.audioName) params.set('audioName', filters.audioName);
    if (filters.ehpad) params.set('ehpad', filters.ehpad);
    if (filters.statut) params.set('statut', filters.statut);
    if (filters.magasin) params.set('magasin', filters.magasin);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);

    const response = await fetch('/api/dossiers?' + params.toString());
    if (!response.ok) {
      setMessage('Impossible de charger les dossiers.');
      return;
    }

    const data = await response.json();
    setDossiers(Array.isArray(data) ? data : []);
  }

  async function updateStatus(id: number, currentStatus: string) {
    const nextStatus = currentStatus === 'En attente' ? 'Payé' : 'En attente';
    const response = await fetch(`/api/dossier/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      setMessage('Impossible de mettre à jour le statut.');
      return;
    }

    const updated = await response.json();
    setDossiers((current) => current.map((item) => (item.id === id ? updated : item)));
  }

  function exportCsv() {
    const header = ['Résident', 'EHPAD', 'Audioprothésiste', 'Centre audio', 'Date appareillage', 'Date facturation', 'Montant (€)', 'Statut'];
    const lines = dossiers.map((dossier) => [
      dossier.resident_name,
      dossier.ehpad,
      dossier.audio_name,
      dossier.magasin,
      dossier.date_appareillage,
      dossier.date_facturation,
      dossier.montant.toFixed(2),
      dossier.statut,
    ]);
    const csv = [header.join(','), ...lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dossiers-gestion-audio.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const totals = useMemo(() => {
    const totalFacture = dossiers.reduce((sum, item) => sum + item.montant, 0);
    const totalPayes = dossiers.filter((item) => item.statut === 'Payé').reduce((sum, item) => sum + item.montant, 0);
    const totalEnAttente = dossiers.filter((item) => item.statut === 'En attente').reduce((sum, item) => sum + item.montant, 0);
    return { totalFacture, totalPayes, totalEnAttente };
  }, [dossiers]);

  return (
    <main>
      <header className="page-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">👂</span>
          <div>
            <p className="brand-name">AudioGest</p>
            <h1>Tableau de bord administrateur</h1>
            <p className="hero-text">Gérez les dossiers audios, modifiez les statuts et exportez vos rapports depuis une interface nette.</p>
          </div>
        </div>
      </header>

      {message && <div className="alert">{message}</div>}

      {!loggedIn ? (
        <section className="section">
          <div className="section-header">
            <div>
              <h2>Connexion administrateur</h2>
              <p>Entrez le mot de passe pour accéder à vos dossiers et gérer les statuts de paiement.</p>
            </div>
          </div>
          <form onSubmit={login} className="form-grid">
            <div>
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="button-row full-width">
              <button type="submit" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <section className="section">
            <div className="section-header">
              <div>
                <h2>Filtres</h2>
                <p>Affinez la liste des dossiers pour voir uniquement ceux qui vous intéressent.</p>
              </div>
              <button className="secondary" onClick={logout}>
                Se déconnecter
              </button>
            </div>
            <div className="form-grid">
              <div>
                <label htmlFor="filterAudio">Audioprothésiste</label>
                <input
                  id="filterAudio"
                  value={filters.audioName}
                  onChange={(event) => setFilters({ ...filters, audioName: event.target.value })}
                  placeholder="Nom de l'audioprothésiste"
                />
              </div>
              <div>
                <label htmlFor="filterEhpad">EHPAD</label>
                <input
                  id="filterEhpad"
                  value={filters.ehpad}
                  onChange={(event) => setFilters({ ...filters, ehpad: event.target.value })}
                  placeholder="Nom de l'EHPAD"
                />
              </div>
              <div>
                <label htmlFor="filterMagasin">Centre audio</label>
                <input
                  id="filterMagasin"
                  value={filters.magasin}
                  onChange={(event) => setFilters({ ...filters, magasin: event.target.value })}
                  placeholder="Centre audio de facturation"
                />
              </div>
              <div>
                <label htmlFor="filterStatut">Statut</label>
                <select
                  id="filterStatut"
                  value={filters.statut}
                  onChange={(event) => setFilters({ ...filters, statut: event.target.value })}
                >
                  {STATUT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option || 'Tous'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="startDate">Période début</label>
                <input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => setFilters({ ...filters, startDate: event.target.value })}
                />
              </div>
              <div>
                <label htmlFor="endDate">Période fin</label>
                <input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(event) => setFilters({ ...filters, endDate: event.target.value })}
                />
              </div>
            </div>
            <div className="button-row full-width">
              <button type="button" onClick={loadDossiers}>
                Appliquer les filtres
              </button>
              <button type="button" className="danger" onClick={() => setFilters({ audioName: '', ehpad: '', statut: '', magasin: '', startDate: '', endDate: '' })}>
                Effacer
              </button>
              <button type="button" className="secondary" onClick={exportCsv}>
                Exporter CSV
              </button>
            </div>
          </section>

          <section className="section">
            <h2>Totaux</h2>
            <div className="card">
              <p><strong>Total facturé :</strong> {totals.totalFacture.toFixed(2)} €</p>
              <p><strong>Total encaissé :</strong> {totals.totalPayes.toFixed(2)} €</p>
              <p><strong>Total en attente :</strong> {totals.totalEnAttente.toFixed(2)} €</p>
            </div>
          </section>

          <section className="section">
            <h2>Liste des dossiers</h2>
            {dossiers.length === 0 ? (
              <p>Aucun dossier ne correspond aux filtres.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Résident</th>
                    <th>EHPAD</th>
                    <th>Audioprothésiste</th>
                    <th>Centre audio</th>
                    <th>Appareillage</th>
                    <th>Facturation</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map((dossier) => (
                    <tr key={dossier.id}>
                      <td>{dossier.resident_name}</td>
                      <td>{dossier.ehpad}</td>
                      <td>{dossier.audio_name}</td>
                      <td>{dossier.magasin}</td>
                      <td>{dossier.date_appareillage}</td>
                      <td>{dossier.date_facturation}</td>
                      <td>{dossier.montant.toFixed(2)} €</td>
                      <td>
                        <span className={`status-chip ${dossier.statut === 'Payé' ? 'status-paye' : 'status-en-attente'}`}>
                          {dossier.statut}
                        </span>
                      </td>
                      <td className="row-actions">
                        <button onClick={() => updateStatus(dossier.id, dossier.statut)}>
                          {dossier.statut === 'En attente' ? 'Marquer payé' : 'Réouvrir'}
                        </button>
                        <button className="secondary" type="button" onClick={() => setHistoryOpenId(historyOpenId === dossier.id ? null : dossier.id)}>
                          Historique
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {historyOpenId && (
              <div className="card">
                <h3>Historique du dossier</h3>
                {dossiers.find((item) => item.id === historyOpenId)?.history?.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Date et heure</th>
                        <th>Ancien statut</th>
                        <th>Nouveau statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dossiers
                        .find((item) => item.id === historyOpenId)
                        ?.history?.map((event) => (
                          <tr key={event.id}>
                            <td>{new Date(event.changed_at).toLocaleString()}</td>
                            <td>{event.old_status}</td>
                            <td>{event.new_status}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <p>Aucun historique disponible pour ce dossier.</p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
