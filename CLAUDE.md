# CLAUDE.md — DocScan

Agent d'extraction de données depuis des PDF techniques (devis, cahiers des charges). La spécification de référence est `SPEC.md` : la lire avant toute nouvelle fonctionnalité.

## Stack
- Next.js (App Router) + TypeScript `strict`
- Supabase : Postgres, Auth (connexion anonyme), Storage
- API Anthropic (`@anthropic-ai/sdk`) : lecture PDF native et tool use pour la sortie structurée
- Zod pour la validation, Tailwind pour l'UI, Vitest pour les tests
- Gestionnaire de paquets : **pnpm**

## Commandes
```bash
pnpm dev                 # serveur local
pnpm typecheck           # tsc --noEmit
pnpm lint                # eslint
pnpm test                # vitest run
supabase start           # Supabase local (Docker)
supabase db reset        # rejoue les migrations + seed
supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

## Structure
```
src/
  app/                    # routes, pages, Server Actions
    api/documents/[id]/extract/route.ts
  lib/
    supabase/             # clients server/browser + types générés
    extraction/
      schemas.ts          # schémas Zod (source unique de vérité)
      prompt.ts           # prompts système par type de document
      extract.ts          # appel Claude + validation + nouvelle tentative
  components/
supabase/migrations/      # SQL versionné
samples/                  # PDF de démo
```

## Conventions
- **DRY** : ne pas dupliquer une logique déjà écrite ailleurs ; en cas de copier-coller d'un bloc de plus de quelques lignes, l'extraire dans une fonction ou un module partagé.
- **KISS** : préférer la solution la plus simple qui couvre le besoin réel ; pas d'abstraction, de configuration ou de couche supplémentaire pour un cas hypothétique.
- Un schéma d'extraction n'est défini **qu'une fois**, en Zod, dans `schemas.ts`. Le JSON Schema du tool en est dérivé, jamais écrit à la main.
- Imports : toujours l'alias `@/` pour le code interne (`@/lib/...`, `@/components/...`), jamais de chemin relatif remontant de plusieurs niveaux (`../../..`).
- Résultat des fonctions pouvant échouer (Server Actions, appels externes) : type dédié `{ ok: true; data? } | { ok: false; error: string }`, nommé `XxxResult` (ex. `ActionResult`, `AuthResult`, `ExtractDocumentResult`) — jamais d'exception levée vers les couches UI.
- Accès aux données : Server Components et Server Actions uniquement. Pas de clé `service_role` dans le code applicatif.
- Les secrets (`ANTHROPIC_API_KEY`, etc.) restent côté serveur. Toute nouvelle variable est ajoutée à `.env.example`.
- Composants : primitives shadcn/ui brutes dans `components/ui/`, composants métier directement dans `components/` (ou un sous-dossier par domaine, ex. `components/auth/`).
- Nommage : fichiers en kebab-case, composants en PascalCase, colonnes SQL en snake_case.
- Ne jamais journaliser le contenu d'un document ni une réponse complète du modèle (RGPD).

## Règles pour Claude
1. **Planifier d'abord** : pour toute tâche de plus d'un fichier, proposer un plan court (fichiers touchés, étapes, risques) et attendre validation.
2. **Petits pas** : une tâche de `SPEC.md §9` à la fois. Ne pas anticiper les tâches suivantes.
3. **Migrations** : ne jamais modifier une migration existante ; en créer une nouvelle. Régénérer les types ensuite.
4. **Dépendances** : demander avant d'en ajouter une.
5. **Tests** : toute logique dans `lib/` a des tests. Les appels Anthropic et Supabase sont mockés dans les tests unitaires.
6. **Définition de « terminé »** : `pnpm typecheck && pnpm lint && pnpm test` passent, puis résumer ce qui a changé et ce qui reste à vérifier à la main.
7. **Ne pas inventer d'API** : en cas de doute sur le SDK Anthropic ou Supabase, le signaler plutôt que deviner.
8. Commits au format Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`), un sujet par commit.

## Points d'attention
- Les réponses du modèle sont des données non fiables : toujours les valider avec Zod avant de les écrire en base.
- Limiter les PDF à 10 Mo et 30 pages, à vérifier côté serveur avant l'appel API.
- Toute nouvelle table doit avoir la RLS activée, avec un test qui vérifie l'isolation entre utilisateurs.
