# Preflight Frontend

## Setup

- Use branch `full-frontend` (not `pf-frontend`)
- `pnpm install`
- `pnpm run dev` (must run on port 5173 only, for the OAuth callback)
- Log in as instructor `wichai.t@cmu.ac.th`, or as a student with your own CMU account

# Containerization and test

- Make `.env.test` from `.env.test.example`
- `docker compose --env-file ./.env.test up -d --force-recreate --build`

# Just building (no running)

- `docker build -t preflight-frontend:latest .`

# Push to dockerhub

- `docker tag preflight-frontend [DOCKERHUB_ACCOUNT]/preflight-frontend:latest`
- `docker push [DOCKERHUB_ACCOUNT]/preflight-frontend:latest`
