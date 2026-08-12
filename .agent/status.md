# Status — kurrier (fork local)

> MàJ : 2026-08-13

**État :** Deux features développées pour le setup Authelia + OVH Zimbra, prêtes à
contribuer upstream (`kurrier-org/kurrier`). Code vérifié (tsc propre, build nitro OK),
**pas encore testé en conditions réelles** ni poussé.

**Branches :**
- `feat/generic-oidc-login` (8b7314f) — provider OIDC générique via env
  (`OIDC_ISSUER_URL`/`OIDC_CLIENT_ID`/`OIDC_CLIENT_SECRET` + `OIDC_PROVIDER_NAME`,
  `OIDC_SCOPES`, `OIDC_TOKEN_AUTH_METHOD`). `client_secret_basic` par défaut
  (piège Authelia), fallback userinfo si l'ID token ne porte pas `email`.
- `feat/provisioning-api` (9e63d19) — API worker : CRUD `/api/kurrier/smtp-accounts`
  + `POST /api/kurrier/identities` (backfill IMAP inclus, statut renvoyé).
- `antor/integration` — merge des deux + ce fichier ; base pour l'image patchée maison.
  Ne JAMAIS pousser cette branche vers la source.

**Prochaines étapes :**
- [ ] Tester en local (docker compose db/) : login Authelia bout en bout + provisioning d'un compte Zimbra OVH via l'API
- [ ] Forker kurrier-org/kurrier sous AntorFR, pousser les 2 branches feature, ouvrir issue + PR (aucune issue OIDC/SSO existante upstream)
- [ ] Image patchée GHCR depuis `antor/integration` en attendant le merge (voir chaîne builder)
- [ ] Déclarer le client OIDC `kurrier` dans Authelia (k8s-home-lab) + env dans le chart
- [ ] Bug upstream repéré au passage (non corrigé, hors périmètre) : `upsertSMTPAccount` dans
      `apps/web/lib/actions/dashboard.ts` (~l.154) fait `tx.insert(accountSecret)` (l'objet ligne,
      pas la table) avec `providerId` au lieu de `accountId` → à signaler en issue séparée
