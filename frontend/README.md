# DistillPage — Frontend

React 19 + Vite 8 single-page application for all four DistillPage tools.

## Structure

```
src/
  App.tsx          Router + layout shell
  main.tsx         Entry point (BrowserRouter, AuthProvider, GoogleOAuthProvider)
  components/      AppNav, UserHeader
  context/         Shared AuthContext (JWT, auto-refresh)
  pages/           PdfTool, ToolPlaceholder
  tools/
    study/         Study tool (ported from readeb / Next.js)
    notes/         Notes tool (ported from note-cards)
    images/        Image editor (ported from picnice)
  index.css        Global styles + Tailwind v4 theme tokens
```

## Dev

```bash
npm install
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
```

Type-check the app shell (excludes vendored tools, which are transpiled by esbuild):

```bash
npx tsc -b
```

## Env vars

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `window.location.origin` | Base URL for the distillpage backend |
| `VITE_GOOGLE_CLIENT_ID` | — | Google OAuth client ID |

