# BudgetAI 🚀

Application web complète d'analyse financière avec détection d'abonnements par IA.

## Stack Technique

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Node.js, API Routes Next.js  
- **Base de données**: PostgreSQL + Prisma ORM
- **IA**: Claude (Anthropic) pour l'analyse des relevés bancaires
- **Charts**: Recharts
- **Auth**: JWT custom (jose)

---

## Installation rapide

### 1. Prérequis
```bash
node >= 18.0.0
npm >= 9.0.0
PostgreSQL >= 14
```

### 2. Cloner et installer
```bash
git clone <repo>
cd budgetai
npm install
```

### 3. Configuration
```bash
cp .env.example .env
```

Remplissez votre `.env` :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/budgetai"
NEXTAUTH_SECRET="votre-clé-secrète-aléatoire"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."
```

### 4. Base de données
```bash
# Créer la base de données
createdb budgetai

# Appliquer le schéma
npm run db:push

# (Optionnel) Données de démonstration
npm run db:seed
```

### 5. Lancer l'application
```bash
npm run dev
# → http://localhost:3000
```

---

## Déploiement

### Vercel + Supabase (Recommandé)

**1. Créer une base de données sur Supabase :**
- Aller sur https://supabase.com → New Project
- Copier l'URL de connexion depuis Settings → Database

**2. Déployer sur Vercel :**
```bash
npm i -g vercel
vercel deploy
```

Configurer les variables d'environnement dans le dashboard Vercel :
- `DATABASE_URL` : URL PostgreSQL Supabase
- `NEXTAUTH_SECRET` : chaîne aléatoire sécurisée (min. 32 chars)
- `ANTHROPIC_API_KEY` : votre clé API Anthropic

**3. Appliquer le schéma :**
```bash
DATABASE_URL="votre-url-supabase" npx prisma db push
```

---

### Docker (Production auto-hébergée)

```bash
docker-compose up -d
```

Fichier `docker-compose.yml` :
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: budgetai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: changethis
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:changethis@db:5432/budgetai
      NEXTAUTH_SECRET: change-this-secret
      ANTHROPIC_API_KEY: sk-ant-...
    depends_on:
      - db

volumes:
  postgres_data:
```

---

## Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 🔐 Authentification | Inscription/connexion sécurisée JWT |
| 📁 Import fichiers | CSV, Excel (.xlsx), PDF |
| 🤖 Analyse IA | Classification automatique des transactions |
| 🔍 Détection abonnements | Algorithme de détection des paiements récurrents |
| 📊 Graphiques | Tendances mensuelles, répartition par catégorie |
| 💰 Simulateur | Calcul d'épargne avec intérêts composés |
| 🔗 Liens résiliation | Liens directs vers les pages de résiliation |

## Structure du projet

```
budgetai/
├── app/
│   ├── api/                  # API Routes (backend)
│   │   ├── auth/             # Authentification
│   │   ├── upload/           # Upload et parsing de fichiers
│   │   ├── transactions/     # CRUD transactions
│   │   ├── subscriptions/    # CRUD abonnements
│   │   ├── dashboard/        # Statistiques dashboard
│   │   ├── insights/         # Insights IA
│   │   └── savings/          # Simulateur d'épargne
│   ├── dashboard/            # Page tableau de bord
│   ├── transactions/         # Page transactions
│   ├── subscriptions/        # Page abonnements
│   ├── statistics/           # Page statistiques
│   ├── settings/             # Page paramètres
│   ├── login/                # Page connexion
│   └── register/             # Page inscription
├── components/
│   ├── layout/               # DashboardLayout avec sidebar
│   └── dashboard/            # UploadModal et widgets
├── lib/
│   ├── prisma.ts             # Client Prisma singleton
│   ├── auth.ts               # Utilitaires JWT/auth
│   ├── ai-analyzer.ts        # Analyse IA (Claude)
│   ├── file-parser.ts        # Parsers CSV/Excel/PDF
│   ├── subscription-detector.ts # Algorithme de détection
│   └── utils.ts              # Utilitaires
├── prisma/
│   ├── schema.prisma         # Schéma base de données
│   └── seed.ts               # Données de démonstration
├── types/
│   └── index.ts              # Types TypeScript partagés
└── public/
    └── sample-bank-statement.csv  # Fichier CSV exemple
```

## Compte de démonstration

Après `npm run db:seed` :
- **Email**: demo@budgetai.app
- **Mot de passe**: demo1234

## Variables d'environnement

| Variable | Description | Requis |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL | ✅ |
| `NEXTAUTH_SECRET` | Clé secrète JWT (min 32 chars) | ✅ |
| `NEXTAUTH_URL` | URL de l'app | ✅ |
| `ANTHROPIC_API_KEY` | Clé API Claude | ✅ |
| `MAX_FILE_SIZE_MB` | Taille max upload (défaut: 10) | ❌ |
