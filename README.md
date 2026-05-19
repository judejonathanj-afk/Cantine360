# Cantine360 — Pilote (3 semaines)

Pilote orienté **cuisine** sur tablette:
- Suivi par **service** (date + déjeuner/dîner) et par **groupe**
- Saisie menu + allergènes
- KPI essentiels + export CSV

## Démarrage (local)

### 1) Prérequis
- Node.js (>= 20)
- Une base **PostgreSQL** accessible (local, cloud, etc.)

> Si vous avez Docker, un `docker-compose.yml` est fourni (Postgres 16).

### 2) Config
Copiez `.env.example` vers `.env` et ajustez:
- `DATABASE_URL`
- `SESSION_SECRET`
- `ADMIN_PIN` / `KITCHEN_PIN`

### 3) Prisma
Générer le client:

```bash
npm run prisma:generate
```

Appliquer les migrations (**obligatoire**, sinon erreurs du type table `Service` introuvable sur le Dashboard):

```bash
docker compose up -d    # si tu utilises le Postgres du projet
npm run prisma:migrate  # crée les tables (dont Service, Group, etc.)
```

### 4) Lancer l’app

```bash
npm run dev
```

Ouvrir `http://localhost:3000`.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
