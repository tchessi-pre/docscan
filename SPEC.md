# DocScan — Spécification

> Démo : un agent IA qui extrait les informations clés de documents techniques (PDF) et les présente dans un tableau que l'utilisateur relit et valide.

## 1. Contexte et objectif

Dans les bureaux d'études et les PME, on perd du temps à relire des devis et des cahiers des charges pour en sortir toujours les mêmes informations : montants, délais, exigences, interlocuteurs.

DocScan permet d'**uploader un PDF**, de **choisir son type** et d'obtenir une **extraction structurée**. Chaque champ est accompagné de **sa source** (page et citation). L'utilisateur **relit, corrige et valide** : c'est un humain qui a le dernier mot, pas l'IA.

## 2. Périmètre

### Inclus (MVP)

- Compte utilisateur (email + mot de passe) : inscription, connexion, déconnexion, mot de passe oublié
- Upload d'un PDF (≤ 10 Mo, ≤ 30 pages)
- Choix du type : **Devis**, **Cahier des charges**, **Autre** (extraction générique)
- Extraction par l'API Claude (lecture native du PDF + sortie structurée via tool use)
- Tableau des champs extraits : valeur, page source, citation, niveau de confiance
- Modification manuelle d'un champ, puis validation du document
- Liste des documents avec leur statut
- Export JSON / CSV d'une extraction validée
- Suppression d'un document (fichier + données)

### Exclus

- OCR de documents scannés (on suppose des PDF texte)
- Traitement en lot, file d'attente, webhooks
- Équipes, rôles et partage de documents entre utilisateurs
- Facturation, quotas

## 3. Parcours utilisateur

1. L'utilisateur arrive sur `/` : sans session, il est redirigé vers `/login`. Il crée un compte (email + mot de passe) ou se connecte.
2. Il dépose un PDF et choisit le type → le fichier est envoyé dans Supabase Storage, une ligne `documents` est créée (`uploaded`).
3. Il clique sur « Analyser » → statut `processing` → appel à Claude → statut `extracted` (ou `failed` avec le message d'erreur).
4. Sur `/documents/[id]` : le PDF est à gauche, le tableau des champs à droite. Un clic sur un champ affiche sa citation source.
5. Il corrige ce qui doit l'être puis clique sur « Valider » → statut `validated`, et l'export devient disponible.

## 4. Schémas d'extraction

Chaque champ extrait a la forme suivante :

```ts
type ExtractedField = {
	key: string; // ex. "montant_ttc"
	label: string; // ex. "Montant TTC"
	value: string | null; // null si absent du document
	page: number | null; // page source
	quote: string | null; // extrait court du document justifiant la valeur
	confidence: 'high' | 'medium' | 'low';
};
```

**Devis** : émetteur, client, numéro, date, validité, montant HT, TVA, montant TTC, conditions de paiement, délai de réalisation, lignes principales (désignation, quantité, prix).

**Cahier des charges** : maître d'ouvrage, objet, date limite de réponse, budget indicatif, livrables, exigences techniques clés, normes citées, critères de sélection, contact.

**Autre** : titre, auteur/émetteur, date, résumé (3 phrases), 5 points clés, dates et montants mentionnés.

Règles imposées au modèle :

- ne jamais inventer : une valeur absente donne `null` ;
- toujours fournir `page` et `quote` quand `value` n'est pas null ;
- `confidence: "low"` si l'information est ambiguë ou déduite.

Chaque schéma est défini **une seule fois en Zod**. Il sert à la fois à construire l'`input_schema` du tool et à valider la réponse.

## 5. Modèle de données (Supabase / Postgres)

```sql
create type doc_status as enum ('uploaded','processing','extracted','validated','failed');
create type doc_type   as enum ('quote','specification','other');

create table documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  filename      text not null,
  storage_path  text not null,
  doc_type      doc_type not null,
  status        doc_status not null default 'uploaded',
  error         text,
  created_at    timestamptz not null default now()
);

create table extractions (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents(id) on delete cascade,
  fields        jsonb not null,          -- ExtractedField[]
  model         text not null,
  input_tokens  int,
  output_tokens int,
  edited        boolean not null default false,
  validated_at  timestamptz,
  created_at    timestamptz not null default now()
);
```

- **RLS activée** sur les deux tables : un utilisateur ne voit que ses propres documents (`user_id = auth.uid()`, et via jointure pour `extractions`).
- Bucket Storage `documents` privé, avec des chemins `{user_id}/{document_id}.pdf` et une policy alignée.

## 6. Architecture

```
Next.js (App Router, TypeScript)
├─ Server Components  → lecture des données via Supabase (session utilisateur)
├─ Server Actions     → upload, validation, suppression, édition d'un champ
└─ Route Handler POST /api/documents/[id]/extract
      1. vérifie la propriété du document
      2. télécharge le PDF depuis Storage
      3. appelle Claude (PDF en base64 + tool `record_extraction`)
      4. valide la sortie avec Zod
      5. écrit `extractions` et met à jour le statut
```

- La clé Anthropic n'est utilisée que côté serveur (`ANTHROPIC_API_KEY`), et le modèle est configurable (`ANTHROPIC_MODEL`).
- `tool_choice` force le tool `record_extraction`, ce qui garantit une sortie structurée.
- Si la sortie est invalide (Zod) : une nouvelle tentative en renvoyant l'erreur de validation au modèle. Si elle échoue encore, statut `failed`.
- On journalise les tokens consommés pour pouvoir suivre les coûts.

## 7. Sécurité et RGPD

- Pas de clé API ni de secret côté client ; variables listées dans `.env.example`.
- Authentification email + mot de passe via Supabase Auth ; toutes les routes applicatives exigent une session (redirection vers `/login` sinon).
- RLS et bucket privé ; l'accès au PDF passe par des URLs signées de courte durée.
- Minimisation : on ne stocke que le PDF et les champs extraits, sans journaliser le contenu des documents.
- Droit à l'effacement : la suppression d'un document efface le fichier et les données (cascade).
- Durée de conservation : les documents de plus de 30 jours sont purgés (script ou cron Supabase, à documenter).
- Une mention dans l'UI indique que le document est transmis à un sous-traitant IA (Anthropic). Les données envoyées via l'API ne servent pas à entraîner les modèles par défaut.

## 8. Critères d'acceptation

- [ ] Un devis PDF de démo produit au moins 8 champs non nuls, chacun avec sa page et sa citation.
- [ ] Une information absente du document donne `null`, jamais une valeur inventée.
- [ ] Un utilisateur B ne peut ni lire ni supprimer un document de l'utilisateur A (test RLS).
- [ ] Une sortie modèle invalide ne casse pas l'app : le statut passe à `failed` et l'erreur est lisible.
- [ ] `pnpm typecheck`, `pnpm lint` et `pnpm test` passent.
- [ ] L'app est déployée (Vercel + Supabase) avec 3 PDF de démo fournis dans `/samples`.

## 9. Découpage en tâches

Chaque tâche correspond à une PR ou un commit, et est relue avant de passer à la suivante.

1. **Init** : Next.js + TypeScript strict + ESLint + Vitest + Tailwind, `CLAUDE.md`, `.env.example`.
2. **Supabase** : migration (tables, enums, RLS, bucket et policies), génération des types.
3. **Schémas** : schémas Zod des 3 types, conversion en JSON Schema, tests unitaires.
4. **Upload** : formulaire, Server Action, Storage, liste des documents.
5. **Extraction** : client Anthropic, route `/extract`, validation et nouvelle tentative, tests avec le SDK mocké.
6. **Relecture** : page détail (PDF + tableau), édition d'un champ, validation.
7. **Export et suppression** : export JSON/CSV, suppression en cascade.
8. **Finitions** : états de chargement et d'erreur, mention RGPD, PDF de démo, README, déploiement.
9. **Authentification** : inscription, connexion, déconnexion et mot de passe oublié (email + mot de passe), protection des routes dans `proxy.ts`.
