# Status — kurrier (fork local)

> MàJ : 2026-08-15

**État :** Prod en cours de bascule vers `v3.2.1-antor.13`. **Les 5 features sont
implémentées.** Gate CI tsc actif sur fork-images. **Suite e2e Playwright : 9/9**
(stack locale compose + greenmail + mock-oidc, seed via l'API admin — voir e2e/README).
Feature 5 (conversations) : adoption d'orphelins (parent après réponses, GIN sur
messages.references) + repli par sujet normalisé (threads.normalized_subject,
migration 005) — badge de compteur UI existant s'allume naturellement. La
construction du harnais a débusqué et corrigé 3 bugs de plus (liste masquée par le
useParams du slot retenu, viewer tué par rejection non gérée, IdP http refusé).

**Upstream (kurrier-org/kurrier) :**
- Issues #497 (OIDC générique), #498 (API provisioning), #499 (bug request.url),
  #500 (bug upsertSMTPAccount).
- PR **#501** (OIDC générique) — review positive de krokhale, refonte sub-first
  demandée → **poussée** (b49e161, inclut sa version du callback Google + ancrage
  WEB_URL qui ferme #499) + réponse postée. PR **#502** (provisioning) et
  **#503** (clé admin, stacked sur 502) — en attente de review.
- À proposer aussi : les fixes création de dossier (workspace_id non évalué hors
  session RLS, `String(undefined)` en parentId, exists-detection responseText,
  no-op silencieux du handler add-new) — commis 4260da4^..ec42421 sur
  feat/archive-button ; le bouton Archiver lui-même peut faire une 4ᵉ PR.

**Branches (fork AntorFr/kurrier) :**
- `feat/generic-oidc-login` — OIDC générique + sub-first + fix WEB_URL (PR #501).
- `feat/provisioning-api` — API smtp-accounts/identities (PR #502).
- `feat/admin-api-key` — clé admin + POST /users (PR #503).
- `feat/archive-button` — bouton Archiver + fixes création de dossier (pas encore de PR).
- `antor/integration` — merge de tout + workflow fork-images + ce fichier. JAMAIS upstream.

**Déploiement :** manifeste tantive/tools/mail (images antor.6, dbInit → fork,
OIDC_* + API_ADMIN_KEY) ; client Authelia homenode ; coffre : secret/oidc/kurrier
+ apps/kurrier (api_admin_key). creds-sync = 4 cibles dont Kurrier.
Nouvelle version : tag v3.2.1-antor.N+1 sur antor/integration → CI → bump manuel.

**Prochaines étapes :**
- [ ] L'utilisateur re-teste : login SSO (chemin sub-first) + bouton Archiver dans le webmail
- [ ] Ouvrir la PR #4 upstream : bouton Archiver + fixes dossier (attendre le verdict de #501 ?)
- [ ] Feature 5 : regroupement par conversation (type Gmail/Outlook) — noter que le schéma a déjà threads/mailboxThreads, à investiguer
- [ ] Suivre les reviews #501/#502/#503 ; après merges : revenir sur images kurrier-org/*
