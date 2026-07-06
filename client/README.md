# SnapRules Client

React + Vite frontend scaffold for SnapRules.

## Run locally

```bash
cd client
npm install
npm run dev
```

## Notes

- `src/shared/lib/api.ts` configures Axios and attaches the auth token.
- `src/shared/lib/auth.ts` provides login/register/logout state.
- `src/app/App.tsx` defines routing and protected routes.
- `src/features/layout` contains `AuthLayout` and `DashboardLayout`.
