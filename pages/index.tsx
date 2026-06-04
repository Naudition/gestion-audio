import { useEffect, useState, type FormEvent } from 'react';

type Dossier = {
  id: number;
  resident_name: string;
  ehpad: string;
  audio_name: string;
  magasin: string;
  date_appareillage: string;
  date_facturation: string;
  montant: number;
  statut?: string;
};

export default function Home() {
  const [audioName, setAudioName] = useState('');
  const [savedAudioName, setSavedAudioName] = useState('');
  const [form, setForm] = useState({
    resident_name: '',
    ehpad: '',
    magasin: '',
    date_appareillage: '',
    date_facturation: '',
    montant: '',
  });
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('gestion-audio-audio-name') || '';
    setSavedAudioName(saved);
    setAudioName(saved);
  }, []);

  useEffect(() => {
    if (savedAudioName) {
      fetchDossiers(savedAudioName);
    }
  }, [savedAudioName]);

  function fetchDossiers(audio: string) {
    fetch(`/api/dossiers?audioName=${encodeURIComponent(audio)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDossiers(data);
        } else {
          setDossiers([]);
        }
      })
      .catch(() => setDossiers([]));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!audioName.trim()) {
      return setMessage('Merci de renseigner le nom de l\'audioprothésiste.');
    }

    const payload = {
      resident_name: form.resident_name,
      ehpad: form.ehpad,
      audio_name: audioName.trim(),
      magasin: form.magasin,
      date_appareillage: form.date_appareillage,
      date_facturation: form.date_facturation,
      montant: form.montant,
    };

    setLoading(true);
    const response = await fetch('/api/dossiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!response.ok) {
      const error = await response.json();
      return setMessage(error.error || 'Impossible de créer le dossier.');
    }

    window.localStorage.setItem('gestion-audio-audio-name', audioName.trim());
    setSavedAudioName(audioName.trim());
    setMessage('Dossier créé avec succès.');
    setForm({ resident_name: '', ehpad: '', magasin: '', date_appareillage: '', date_facturation: '', montant: '' });
    fetchDossiers(audioName.trim());
  }

  function clearForm() {
    window.localStorage.removeItem('gestion-audio-audio-name');
    setAudioName('');
    setSavedAudioName('');
    setForm({ resident_name: '', ehpad: '', magasin: '', date_appareillage: '', date_facturation: '', montant: '' });
    setDossiers([]);
    setMessage('Le formulaire a été effacé.');
  }

  return (
    <main>
      <header className="page-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">👂</span>
          <div>
            <p className="brand-name">AudioGest</p>
            <h1>Gestion des dossiers d'appareillage auditif</h1>
            <p className="hero-text">Créez et suivez vos dossiers sur le terrain avec une interface claire et tactile.</p>
          </div>
        </div>
      </header>

      {message && <div className="alert">{message}</div>}

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Créer un nouveau dossier</h2>
            <p>Complétez le formulaire ci-dessous pour enregistrer immédiatement un dossier.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field-group full-width">
            <h3 className="field-title">Nom de l'audioprothésiste</h3>
            <label htmlFor="audioName">Audioprothésiste</label>
            <input
              id="audioName"
              value={audioName}
              onChange={(event) => setAudioName(event.target.value)}
              placeholder="Saisissez le nom de l'audioprothésiste"
              required
            />
          </div>

          <div>
            <label htmlFor="resident_name">Nom du résident</label>
            <input
              id="resident_name"
              value={form.resident_name}
              onChange={(event) => setForm({ ...form, resident_name: event.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="ehpad">Nom de l'EHPAD</label>
            <input
              id="ehpad"
              value={form.ehpad}
              onChange={(event) => setForm({ ...form, ehpad: event.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="magasin">Centre audio</label>
            <input
              id="magasin"
              value={form.magasin}
              onChange={(event) => setForm({ ...form, magasin: event.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="date_appareillage">Date d'appareillage</label>
            <input
              id="date_appareillage"
              type="date"
              value={form.date_appareillage}
              onChange={(event) => setForm({ ...form, date_appareillage: event.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="date_facturation">Date de facturation</label>
            <input
              id="date_facturation"
              type="date"
              value={form.date_facturation}
              onChange={(event) => setForm({ ...form, date_facturation: event.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="montant">Montant facturé (€)</label>
            <input
              id="montant"
              type="number"
              step="0.01"
              value={form.montant}
              onChange={(event) => setForm({ ...form, montant: event.target.value })}
              required
            />
          </div>

          <div className="button-row full-width">
            <button type="submit">{loading ? 'Enregistrement...' : 'Créer le dossier'}</button>
            <button type="button" className="danger" onClick={clearForm}>
              Effacer
            </button>
          </div>
        </form>
      </section>

      <section className="section">
        <h2>Mes dossiers</h2>
        {dossiers.length ? (
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
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Aucun dossier n'est encore disponible pour ce nom de l'audioprothésiste.</p>
        )}
        <p className="help-text">
          Le statut de paiement n'est pas affiché pour les audioprothésistes. Seul l'administrateur peut le modifier.
        </p>
      </section>

      <section className="section admin-link-section">
        <h2>Accès administrateur</h2>
        <p>
          <a className="link-button" href="/administrateur">
            Accéder au tableau de bord administrateur
          </a>
        </p>
      </section>
    </main>
  );
}
