# Status — kurrier (fork local)

> MàJ : 2026-09-04

**État :** **`v4.0.0-antor.2` EN PROD** (tantive/tools, déployée le 04/09). Fork remis à
niveau sur upstream v4 (113 commits absorbés), migrations 001→009 appliquées, webmail OK
(`/` → 302 vers `/en/auth/login`, login 200), les 4 boucles IMAP temps réel tournent.

**Le correctif principal est vérifié en prod :** `mailbox_sync.synced_at` est passé du
**14/08** (figé depuis des semaines) à l'heure du déploiement. Avant, un redémarrage
relançait bien l'IDLE mais ne rattrapait rien — la boîte restait aveugle jusqu'au message
suivant. C'était la cause de la panne : mails du 21 et 22/08 devenus visibles seulement le
02/09, quand un nouveau mail a enfin déclenché un delta-fetch.

**Ce que le rebase a changé :**
- Nos 3 PR (#501 OIDC générique, #502 provisioning, #503 clé admin) sont **dans upstream**.
- Abandonnés au profit d'upstream : `resolveWorkspaceRedirectUrl` (→ `getDefaultWorkspacePath`,
  lecture seule et résout l'identité par défaut), la recherche du dossier Sent dans
  `email-renderer` (plus consommée, et elle redéclarait `params`), le composant mobile de
  liste et la page racine non localisée (supprimés en amont).
- Reconduits sur la base upstream : bouton **Archiver** (barre + ligne, adapté à l'i18n et à
  la sélection d'upstream), masquage optimiste scopé au dossier source, `ThreadSlotGuard`,
  gate de la liste sur `usePathname`, suite e2e, workflow fork-images.

**☠️ Piège de bascule — migrations renumérotées (fait, à connaître pour un DR) :**
notre ancienne `005` (regroupement de conversations) est devenue **`009`**, upstream ayant sa
propre `005` (`provider_kind 'inbound'`) + `006`/`007` (JMAP)/`008`. Le bootstrap
(`db/init/db-bootstrap.sh`) suit le **nom de fichier** : il a fallu
`DELETE FROM public.migrations WHERE version='005_migration';` **avant** le déploiement, sinon
`005`→`008` étaient sautées. Fait le 04/09, les 9 migrations sont appliquées. Backup préalable :
`~/Dev/tmp/kurrier-pre-v4-20260904.dump` (pg_dump -Fc, 943 Ko, 627 entrées, vérifié).

**☠️ Piège d'image — nodemailer 9 casse le worker (corrigé dans `apps/worker/Dockerfile`) :**
depuis le passage upstream de nodemailer `^7` à `^9`, le tracing des externals de Nitro copie
le paquet **sans son point d'entrée** (`lib/nodemailer.js` absent de
`.output/server/node_modules/.nitro/nodemailer@9.0.6/`), et le symlink laissé à côté **masque**
la copie complète que `pnpm install --prod` pose dans `/app/node_modules`. Le worker meurt au
démarrage en `ERR_MODULE_NOT_FOUND`. `antor.1` était donc inutilisable ; `antor.2` supprime la
copie tronquée à la construction. **Même Dockerfile qu'upstream → leurs images worker v4 ont
le même défaut.** Contrôle utile sur une image : comparer le `main` de chaque paquet de
`.output/server/node_modules/.nitro/*/` avec les fichiers réellement présents. `form-data` est
tronqué pareil mais **inerte** (il l'était déjà en v3.2.1, qui a tourné des semaines) ;
`entities` est tronqué sans copie de secours — à surveiller.

**Prochaines étapes :**
- [ ] PR upstream : rattrapage IMAP au démarrage du temps réel (le bug est intact dans `main`)
- [ ] PR upstream : `Dockerfile` worker / nodemailer 9 — leur image v4 ne démarre pas non plus
- [ ] PR upstream : liste masquée par `useParams` dans `webmail-list.tsx` (slot parallèle retenu)
- [ ] Suite e2e **non rejouée** sur cette v4 (le gate CI typecheck, lui, est vert) — à monter
      avant le prochain saut de version
- [ ] L'utilisateur re-teste : login SSO, bouton Archiver, arrivée d'un nouveau mail
- [ ] La landing page racine d'upstream rend la règle Traefik `kurrier-root-to-login`
      optionnelle — à retirer si on préfère la landing
- [ ] PR upstream restante du backlog : fixes création de dossier (branche `feat/archive-button`)
