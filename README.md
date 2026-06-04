# Gestion Audio - Application de Gestion de Dossiers d'Appareillage Auditif

Application web complète de gestion de dossiers d'appareillage auditif avec deux niveaux d'accès et interface bilingue français/English.

## Fonctionnalités

### Pour les Audios (Techniciens)
- ✅ Enregistrement du nom avec persistance localStorage
- ✅ Création de dossiers avec les informations du résident et de l'appareillage
- ✅ Affichage du tableau personnel des dossiers créés
- ✅ Pas de connexion requise

### Pour l'Administrateur
- ✅ Connexion sécurisée par mot de passe (httpOnly cookie)
- ✅ Tableau de bord complet avec tous les dossiers
- ✅ Filtres avancés:
  - Par audioprothésiste
  - Par EHPAD
  - Par centre audio
  - Par statut de paiement
  - Par plage de dates
- ✅ Totaux en temps réel:
  - Montant total facturé
  - Montant total payé
  - Montant total en attente
- ✅ Modification du statut paiement (En attente → Payé)
- ✅ Historique des changements de statut par dossier
- ✅ Export CSV des dossiers filtrés
- ✅ Interface responsive (mobile et desktop)

## Stack Technique

- **Framework**: Next.js 14.2.5
- **Frontend**: React 18.3.1 avec TypeScript
- **Base de données**: SQLite via sql.js (pure JavaScript, aucune compilation native)
- **Authentification**: Cookie httpOnly sécurisé
- **Styling**: CSS personnalisé responsive

## Installation & Démarrage

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Builder pour la production
npm run build

# Lancer la production
npm start
```

L'application démarre sur `http://localhost:3000`

## Accès

- **Audios (Techniciens)**: `http://localhost:3000/` - Pas de connexion
- **Administrateur (Gestion)**: `http://localhost:3000/patron` - Connexion requise

## Authentification

### Mot de passe administrateur
- **Par défaut**: `patron123`
- **Personnalisé**: Définissez la variable d'environnement `ADMIN_PASSWORD` ou `PATRON_PASSWORD`

Exemple:
```bash
ADMIN_PASSWORD=mon_mot_de_passe npm run dev
```

## Structure de la Base de Données

### Table `dossiers`
- `id`: Identifiant unique (clé primaire)
- `resident_name`: Nom du résident
- `ehpad`: Établissement de santé
- `audio_name`: Nom de l'audioprothésiste
- `magasin`: Centre audio de prescription
- `date_appareillage`: Date de l'appareillage
- `date_facturation`: Date de facturation
- `montant`: Montant en euros
- `statut`: État du paiement (En attente / Payé)
- `created_at`: Date de création
- `updated_at`: Date de dernière modification

### Table `status_history`
- `id`: Identifiant unique
- `dossier_id`: Référence au dossier
- `old_status`: Ancien statut
- `new_status`: Nouveau statut
- `changed_at`: Timestamp du changement

## API Endpoints

### Public (Audio)
- `GET /api/dossiers?audioName=X` - Récupère les dossiers d'un audioprothésiste
- `POST /api/dossiers` - Crée un nouveau dossier

### Authentification
- `POST /api/login` - Connexion administrateur (corps: `{password: string}`)
- `POST /api/logout` - Déconnexion administrateur
- `GET /api/login-status` - Vérifie l'authentification administrateur

### Protégée (Administrateur uniquement)
- `GET /api/dossiers` - Récupère TOUS les dossiers (sans audioName requis)
- `PATCH /api/dossier/[id]/status` - Modifie le statut (corps: `{status: "Payé" | "En attente"}`)

## Tests d'API

### Créer un dossier
```bash
curl -X POST http://localhost:3000/api/dossiers \
  -H "Content-Type: application/json" \
  -d '{
    "audio_name": "Jean Dupont",
    "resident_name": "Marie Martin",
    "ehpad": "EHPAD Soleil",
    "magasin": "Nice",
    "date_appareillage": "2024-01-15",
    "date_facturation": "2024-01-16",
    "montant": "850.00"
  }'
```

### Récupérer les dossiers d'un audioprothésiste
```bash
curl http://localhost:3000/api/dossiers?audioName=Jean%20Dupont
```

### Connexion administrateur
```bash
curl -c cookies.txt -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"password": "patron123"}'
```

### Modifier le statut (avec authentification)
```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/dossier/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "Payé"}'
```

## Design Responsive

L'interface s'adapte automatiquement aux différentes tailles d'écran:
- **Mobile** (< 820px): Vue en cartes avec données verticales
- **Desktop** (≥ 820px): Vue tableaux complets

## Persistance des Données

La base de données est stockée dans `/data/gestion-audio.db` et est persévérée automatiquement après chaque opération.

## Déploiement

Pour déployer en production, build et démarrez avec:
```bash
npm run build
npm start
```

L'application fonctionne sur n'importe quel serveur Node.js supportant Next.js.

## Notes Importantes

- L'historique des statuts est conservé pour audit
- Les audios ne voient pas le statut paiement de leurs dossiers
- La pagination n'est pas implémentée (TODO)
- L'édition de dossiers existants n'est pas supportée (TODO)

