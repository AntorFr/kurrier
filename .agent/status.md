# Status — kurrier (fork local)

> MàJ : 2026-08-13

**État :** Features Authelia + provisioning **déployées en prod** (mail.berard.me,
tantive) via l'image du fork `ghcr.io/antorfr/kurrier-{web,worker}:v3.2.1-antor.2`.
Chaîne OIDC vérifiée par curl de bout en bout (start → Authelia → token
`client_secret_basic` → callback), API worker en place (401 sans clé). Reste le
login navigateur (utilisateur) et un provisioning Zimbra réel.

**Branches (poussées sur AntorFr/kurrier) :**
- `feat/generic-oidc-login` (8b7314f + fix fbae59d) — OIDC générique via env.
  Le fix fbae59d est CRITIQUE : Next standalone réécrit `request.url` (host = pod)
  et openid-client v6 en dérive le redirect_uri ⇒ ancré sur `WEB_URL`.
  Le flow Google upstream a le même bug (matière à issue/PR séparée).
- `feat/provisioning-api` (9e63d19) — CRUD `/api/kurrier/smtp-accounts`
  + `POST /api/kurrier/identities` (backfill IMAP, statut renvoyé).
- `antor/integration` — merge des deux + workflow `fork-images.yml` (tags
  `v*-antor*` → images GHCR, amd64) + ce fichier. Ne JAMAIS pousser upstream.

**Déploiement (k8s-home-lab) :**
- `clusters/tantive/tools/mail/kurrier-helm-config.yml` : images fork,
  `dbInit.sourceRepo` → fork (le tag -antor.N n'existe que là), env `OIDC_*`.
- `clusters/homenode/infra/authelia-helm-config.yml` : client `kurrier`.
- Nouvelle version : tag `v3.2.1-antor.N+1` sur antor/integration → CI fork
  → bump `image.tag` du manifeste (Renovate ne suit pas ce pattern -antor).

**Prochaines étapes :**
- [ ] Test login navigateur via « SSO berard.me » (utilisateur)
- [ ] Provisioning réel d'un compte OVH Zimbra via l'API (besoin : API key du dashboard + creds Zimbra)
- [ ] Upstream : issue + 2 PR depuis les branches feature (aucune issue OIDC/SSO existante) ; signaler aussi le bug request.url du flow Google et le bug `upsertSMTPAccount` (dashboard.ts ~l.154 : `tx.insert(accountSecret)` au lieu de la table, champ `providerId` au lieu d'`accountId`)
- [ ] Après merge upstream : revenir sur les images kurrier-org/* et retirer le client/env spécifiques si obsolètes
