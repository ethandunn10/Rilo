# Deploying Rilo

The app is in `app/`, **not** at the repo root — there is no `package.json`
here. A host pointed at this repository with default settings finds nothing
to build, which is the usual reason a push appears to succeed and the live
site never changes.

`vercel.json` fixes that explicitly, so it works from a clean import with
nothing configured in a dashboard:

| setting | value | why |
|---|---|---|
| install | `npm install --prefix app` | deps live in `app/` |
| build | `npm run build --prefix app` | vite build |
| output | `app/dist` | what vite writes |
| rewrites | everything → `/index.html` | single-page app |

The rewrite matters beyond tidiness: the app reads `window.location.pathname`
for its hidden `/results` screen, and without a rewrite that URL 404s on the
server before React ever loads. (`#results` works either way — that's the
fallback the code mentions.)

If a Vercel project already sets **Root Directory** to `app` in its
dashboard, Vercel reads `app/vercel.json` instead and this file is simply
ignored. So it either fixes the deploy or does nothing.

## On Netlify instead

Same three values, in `netlify.toml` at the root:

```toml
[build]
  base = "app"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Before pushing

```sh
cd app
npm test     # the opens arithmetic, the session rules, the onboarding flow
npm run lint
npm run build
```

`npm test` includes a test that actually types into the onboarding
conversation in a real DOM. It exists because typing once shipped
completely broken while every render test still passed — a screen can look
perfect and be entirely non-functional.

## Testing on a real phone

`npm run dev` binds to the network and prints a LAN address. Open that on a
phone on the same wifi. Phone layout bugs are invisible on a desktop, where
the frame is a full 844px tall and nothing clips.
