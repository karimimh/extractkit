# ExtractKit — Frontend

React 19 + Vite 8 single-page application for ExtractKit's webpage tools.

## Structure

```
src/
  App.tsx          Router + layout shell
  main.tsx         Entry point (BrowserRouter, AuthProvider, GoogleOAuthProvider)
  components/      Navigation, auth, billing, shared UI, and Markdown renderer
  context/         Shared AuthContext (JWT, auto-refresh)
  hooks/           Shared React hooks
  lib/             Backend API clients and utilities
  pages/           Webpage exports, monitoring, history, developer API, and blog
  index.css        Global styles + Tailwind v4 theme tokens
```

## Dev

```bash
npm install
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

For local Vite development, put `VITE_` variables in `frontend/.env`.
For Docker Compose builds, define the same `VITE_` variables in the repository root `.env` so Compose can pass them as build args.

## Build

```bash
npm run build   # outputs to dist/
```

Type-check the application:

```bash
npx tsc -b
```

## Env vars

| Variable                | Default                  | Description                          |
| ----------------------- | ------------------------ | ------------------------------------ |
| `VITE_API_BASE_URL`     | `window.location.origin` | Base URL for the extractkit backend |
| `VITE_GOOGLE_CLIENT_ID` | —                        | Google OAuth client ID               |
