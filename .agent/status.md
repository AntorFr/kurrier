# Status — kurrier (fork local)

> MàJ : 2026-09-04

**État :** Fork **remis à niveau sur upstream v4** (113 commits absorbés). Prod encore en
`v3.2.1-antor.15` — la bascule attend le tag + build CI. Typecheck web et worker verts,
`check-locales` conforme (ko toujours partielle, tolérée).

**Ce que le rebase a changé :**
- Nos 3 PR (#501 OIDC générique, #502 provisioning, #503 clé admin) sont **dans upstream** :
  plus rien à porter, seules les features non proposées ont été reconduites.
- Abandonnés au profit d'upstream : `resolveWorkspaceRedirectUrl` (→ `getDefaultWorkspacePath`,
  lecture seule et résout l'identité par défaut), la recherche du dossier Sent dans
  `email-renderer` (plus consommée, et elle redéclarait `params`), le composant mobile de liste
  (supprimé upstream), la page racine non localisée (upstream a une landing page).
- Reconduits sur la base upstream : bouton **Archiver** (barre + ligne, adapté à l'i18n et à la
  sélection d'upstream), masquage optimiste scopé au dossier source, `ThreadSlotGuard`,
  gate de la liste sur `usePathname`, suite e2e, workflow fork-images.

**⚠️ Bascule prod — geste obligatoire AVANT le déploiement :**
notre ancienne migration `005` (regroupement de conversations) est renumérotée en **`009`**,
car upstream a sa propre `005` (`provider_kind 'inbound'`) plus `006`/`007` (JMAP)/`008`.
Le bootstrap suit le **nom de fichier** : tant que la ligne `005_migration` reste en base, les
migrations upstream `005`→`008` sont sautées et l'app v4 casse.

```sql
DELETE FROM public.migrations WHERE version = '005_migration';
```

Puis redéployer : `005`→`008` (upstream) s'appliquent, `009` (la nôtre) est rejouée sans effet
(elle est idempotente). Vérifié en prod : l'enum `provider_kind` ne contient ni `inbound`, ni
`jmap`, ni `mailtrap` → aucune collision d'`ALTER TYPE`.

**Bugs upstream trouvés au passage (candidats PR) :**
- **Sync IMAP sans rattrapage** — corrigé ici (commit `Catch up on missed mail…`). Cause réelle
  de la boîte figée 18 jours : le temps réel ne réagit qu'à `EXISTS`, rien ne poll, donc tout
  mail arrivé sans connexion IDLE vivante reste invisible jusqu'au message suivant. **À proposer
  upstream** — le bug y est intact.
- **Liste masquée par `useParams`** (`webmail-list.tsx`) : un slot de route parallèle retenu
  garde `threadId` après retour à la liste. Notre fix `usePathname` est reconduit ; upstream a
  toujours le bug.

**Prochaines étapes :**
- [ ] Tag `v4.0.0-antor.1` sur `antor/integration` → CI fork-images → bump du tag dans
      `k8s-home-lab` (tantive/tools/mail) — **avec le DELETE de migration juste avant**
- [ ] PR upstream : rattrapage IMAP au démarrage du temps réel (+ éventuellement le fix
      `usePathname` et le `ignoreDeprecations` du tsconfig worker)
- [ ] L'utilisateur re-teste après bascule : login SSO, bouton Archiver, arrivée d'un mail
- [ ] Vérifier la landing page racine d'upstream : la règle de redirect Traefik
      (`mail.berard.me/` → `/en/auth/login`) peut désormais être retirée si on la préfère
- [ ] PR upstream restante du backlog : fixes création de dossier (branche `feat/archive-button`)
