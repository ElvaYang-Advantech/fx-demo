# FX Demo (Vite + exchangerate.host)

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages deployment

1. Push to `main`.
2. In GitHub repository settings, set **Pages > Build and deployment > Source** to **GitHub Actions**.
3. Workflow `.github/workflows/deploy.yml` will build and deploy `dist` automatically.

This project sets `base` to `/fx-demo/` in `vite.config.js`.
