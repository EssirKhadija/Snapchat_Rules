# SnapRules Server (Auth scaffold)

This folder contains the backend foundation and a JWT-based authentication scaffold.

Quick start:

```bash
cd server
npm install
cp .env.example .env
# configure DATABASE_URL and secrets
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Endpoints (v1):
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- GET /api/v1/auth/me (protected)

Swagger UI available at `/docs` when server runs.
