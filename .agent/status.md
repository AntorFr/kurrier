# Status — kurrier (fork local)

> MàJ : 2026-08-13 (soir)

**État :** **Tout est en prod et validé en réel** (mail.berard.me, tantive, image
`ghcr.io/antorfr/kurrier-{web,worker}:v3.2.1-antor.3`). Login SSO Authelia confirmé
par l'utilisateur dans le navigateur. Onboarding complet testé sur Émilie : user
pré-provisionné AVANT son 1er login (`POST /users` created:true), boîte OVH Zimbra
câblée (`backfill: completed`, boucle IDLE active). creds-sync a désormais Kurrier
en 4ᵉ cible (provisioning + rotation, testée : « Kurrier mdp tourné »).

**Branches (poussées sur AntorFr/kurrier) :**
- `feat/generic-oidc-login` (8b7314f + fbae59d) — OIDC générique via env.
  fbae59d est CRITIQUE : Next standalone réécrit `request.url` (host = pod) et
  openid-client v6 en dérive le redirect_uri ⇒ tout ancré sur `WEB_URL`.
  Le flow Google upstream a le même bug (à signaler).
- `feat/provisioning-api` (9e63d19) — CRUD `/api/kurrier/smtp-accounts`
  + `POST /api/kurrier/identities` (backfill IMAP, statut renvoyé).
- `feat/admin-api-key` (4260da4, basée sur provisioning-api) — clé admin
  d'instance `API_ADMIN_KEY` (env worker, opt-in, 32+ chars) : `POST /users`
  (pré-provision avant 1er login, idempotent) + `userEmail` on-behalf sur
  smtp-accounts/identities. Décision : pas de clé par utilisateur (les enfants
  ne créent pas de clé API).
- `antor/integration` — merge des trois + workflow `fork-images.yml` + ce fichier.
  Ne JAMAIS pousser upstream.

**Déploiement (k8s-home-lab + creds-sync) :**
- `clusters/tantive/tools/mail/kurrier-helm-config.yml` : images fork antor.3,
  `dbInit.sourceRepo` → fork, env `OIDC_*` + `API_ADMIN_KEY` (envFile).
- `clusters/homenode/infra/authelia-helm-config.yml` : client `kurrier`
  (secret clair aussi dans `secret/oidc/kurrier` au coffre).
- creds-sync : cible Kurrier (lit API_ADMIN_KEY du Secret `kurrier-env`,
  port-forward éphémère). Onboarder Laurine/Timothée = `creds-sync.py --only <user>`.
- Nouvelle version : tag `v3.2.1-antor.N+1` sur antor/integration → CI fork
  → bump `image.tag` du manifeste (Renovate ne suit pas ce pattern -antor).

**Prochaines étapes :**
- [ ] Feature 4 demandée : bouton **Archiver** dans le webmail (OVH le supporte) — à investiguer/coder
- [ ] Onboarder Laurine + Timothée (`creds-sync.py --only laurine --only timothee`) quand tu veux
- [x] Coffre : `api_admin_key` ajoutée à `secret/apps/kurrier` (kv patch, v2, token admin fourni puis révoqué — 13/08)
- [ ] Upstream : issue + 3 PR depuis les branches feature ; signaler aussi le bug request.url du flow Google et le bug `upsertSMTPAccount` (dashboard.ts ~l.154)
- [ ] Après merge upstream : revenir sur les images kurrier-org/*
