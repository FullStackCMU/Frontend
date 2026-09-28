# Preflight Frontend

## Setup

- Use branch `full-frontend` (not `pf-frontend`)
- Make sure that you already have Backend running from `Backend` project (branch `full-backend`) on port 3001
- `pnpm install`
- `pnpm run dev` (must run on port 5173 only, for the OAuth callback)
- Log in as instructor `wichai.t@cmu.ac.th`, or as a student with your own CMU account
- Test accounts on the mock OAuth (not real passwords), password for all accounts: `1234567890`
  - Instructor `wichai.t@cmu.ac.th`
    - 261497: dashboard, import students, groups, rounds, release results
  - Student `patiphan_leknok@cmu.ac.th`
    - 261492: already in Team Orion, can do round 2 evaluation and see round 1 results
    - 261497: no group yet, for testing joining a group
- Switching accounts needs a private/incognito window (after logout, oauth497 still remembers the last account)

# Containerization and test

- Make `.env.test` from `.env.test.example`
- `docker compose --env-file ./.env.test up -d --force-recreate --build`

# Just building (no running)

- `docker build -t preflight-frontend:latest .`

# Push to dockerhub

- `docker tag preflight-frontend [DOCKERHUB_ACCOUNT]/preflight-frontend:latest`
- `docker push [DOCKERHUB_ACCOUNT]/preflight-frontend:latest`
