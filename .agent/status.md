# Status — kurrier (fork local)

> MàJ : 2026-08-14

**État :** Prod = `v3.2.1-antor.7` (mail.berard.me, tantive). Fix 404 racine : les redirects « déjà connecté » (/ et layout auth) passent par getWorkspaceRedirectUrl (branche fix/signed-in-redirects, PR upstream à ouvrir). Toute la famille
onboardée (4 users, boîtes OVH Zimbra synchronisées, IDLE actif). **Bouton
Archiver livré** (desktop + mobile + sélection multiple) et 4 dossiers Archive
créés côté Zimbra. **Review upstream intégrée** : identité OIDC sub-first
(issuer+sub via auth_accounts, email seulement au 1er login et si vérifié).

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
