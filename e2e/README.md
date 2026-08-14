# E2E regression suite

End-to-end tests for the flows that have actually broken before: auth
redirects, generic OIDC login (sub-first identity mapping), the admin
provisioning API, and the mailbox list/thread/archive journey against a real
IMAP server.

Standalone npm project on purpose — not part of the pnpm workspace, zero
impact on app lockfiles.

## Stack

| Piece | Provided by |
|---|---|
| Postgres, Redis, Typesense, Garage, Baikal | `db/docker-compose.dev.yml` (upstream dev stack) |
| Web (`:3000`) + worker (`:3001`) | `pnpm run dev:web` / `pnpm run dev:worker` |
| Throwaway SMTP/IMAP host (fake mail provider) | `e2e/docker-compose.e2e.yml` → greenmail (`:3025`/`:3143`, auth disabled) |
| OIDC IdP (fake SSO) | `e2e/docker-compose.e2e.yml` → mock-oauth2-server (`:8091`) |

Test data is seeded through the **admin API** (`API_ADMIN_KEY`), i.e. the same
path production automation uses: `POST /users` → `POST /smtp-accounts` →
`POST /identities`.

## Setup

1. Dev stack per the contributing guide (`db/local/.env` from
   `example.develop.env`), plus these additions to `db/local/.env`:

   ```env
   API_ADMIN_KEY=e2e-admin-key-0123456789abcdef0123456789abcdef
   OIDC_ISSUER_URL=http://localhost:8091/default
   OIDC_CLIENT_ID=kurrier-e2e
   OIDC_CLIENT_SECRET=e2e-client-secret
   OIDC_PROVIDER_NAME=E2E SSO
   ```

2. Baikal needs its schema once (the dev compose does not load it):

   ```bash
   docker exec -i local-baikal-postgres-1 psql -U baikal -d baikal < db/init/baikal-init/baikal.sql
   docker restart local-dav-1
   ```

3. Companions + app servers:

   ```bash
   docker compose -f e2e/docker-compose.e2e.yml up -d
   pnpm run dev:web & pnpm run dev:worker &
   ```

4. Run:

   ```bash
   cd e2e && npm install && npx playwright install chromium && npm test
   ```

## Notes

- Greenmail runs with auth disabled: any credentials work, users and
  mailboxes materialize on first use. `provisionStandardFolders` gives a
  mailbox the folder layout of a real host (Sent/Drafts/Trash/Junk/Archive).
- Tests are sequential (`workers: 1`): one shared DB and one shared mail host.
- Each run seeds fresh users (timestamped emails); no cleanup is needed and
  the DB can be wiped by recreating the dev stack.
