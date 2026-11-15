# DocScan

Agent d'extraction de données depuis des PDF techniques (devis, cahiers des charges) : uploadez un PDF, choisissez son type, et obtenez une extraction structurée avec, pour chaque champ, sa page source et sa citation. Vous relisez, corrigez et validez — c'est vous qui avez le dernier mot, pas l'IA.

Voir [SPEC.md](SPEC.md) pour la spécification complète et [CLAUDE.md](CLAUDE.md) pour les conventions du projet.

## Fonctionnalités

- Upload d'un PDF (≤ 10 Mo, ≤ 30 pages) avec choix du type : Devis, Cahier des charges, Autre
- Extraction par l'API Claude (lecture native du PDF + sortie structurée)
- Tableau des champs extraits (valeur, page source, citation, niveau de confiance), édition manuelle et validation
- Export JSON / CSV d'une extraction validée
- Suppression d'un document (fichier + données)

## Stack

Next.js (App Router, TypeScript strict) · Supabase (Postgres, Auth anonyme, Storage) · API Anthropic · Zod · Tailwind · Vitest · pnpm

## Démarrage

Prérequis : Node.js, pnpm, Docker (pour Supabase local), une clé API Anthropic.

```bash
pnpm install
```

```bash
cp .env.example .env.local
```

Remplir `.env.local` :
- `ANTHROPIC_API_KEY` — créée sur [platform.claude.com](https://platform.claude.com) (onglet "Ailleurs" pour une clé statique)
- `ANTHROPIC_MODEL` — ex. `claude-sonnet-5-5`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — affichées par `supabase start` ci-dessous

```bash
supabase start
```

```bash
supabase db reset
```

```bash
supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

```bash
pnpm dev
```

L'app est sur [http://localhost:3000](http://localhost:3000), Supabase Studio sur [http://127.0.0.1:54323](http://127.0.0.1:54323).

> Les scripts `dev`/`build`/`start` lancent Next.js avec `NODE_OPTIONS=--use-system-ca` (via `cross-env`), pour que Node fasse aussi confiance au magasin de certificats du système — utile si un antivirus ou un proxy d'entreprise inspecte le trafic HTTPS.

## Scripts

| Commande | Description |
| --- | --- |
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Tests (Vitest) |
| `supabase start` / `supabase stop` | Démarrer/arrêter la stack Supabase locale |
| `supabase db reset` | Rejoue les migrations |

## PDF de démo

Trois PDF synthétiques (contenu fictif) sont fournis dans [`samples/`](samples/), un par type de document, pour tester l'extraction sans document réel :
- `devis-demo.pdf`
- `cahier-des-charges-demo.pdf`
- `autre-demo.pdf`

## Déploiement

L'app vise un déploiement Vercel (Next.js) + Supabase cloud (base, auth, storage) :

1. Créer un projet sur [supabase.com](https://supabase.com), puis lier le projet local : `supabase link --project-ref <ref>` et pousser les migrations avec `supabase db push`.
2. Régénérer les types contre le projet distant si besoin : `supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts`.
3. Activer la connexion anonyme dans le projet Supabase cloud (Authentification → Providers → Anonymous Sign-Ins).
4. Créer un bucket Storage privé nommé `documents` (les policies sont déjà dans la migration).
5. Importer le dépôt sur [Vercel](https://vercel.com/new), configurer les 4 variables d'environnement de `.env.example` avec les valeurs du projet Supabase cloud et une clé Anthropic de production.
6. Déployer.

Les documents de plus de 30 jours doivent être purgés périodiquement (RGPD, cf. `SPEC.md` §7) — à mettre en place via un cron Supabase ou une tâche planifiée externe.
