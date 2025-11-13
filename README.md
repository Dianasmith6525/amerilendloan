# AmeriLend

This repository contains the AmeriLend application. See `README_DEPLOY.md` for deployment instructions (Render, Wix DNS, SendGrid verification).

Quick start (development):

```powershell
npm install
npm run dev
```

Build for production:

```powershell
npm ci
npm run build
```

Run production locally (for smoke tests):

```powershell
$env:NODE_ENV = "production"; node dist/index.js
```
