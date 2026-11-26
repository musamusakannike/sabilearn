# SabiLearn Desktop

Lightweight, offline-first desktop app for **Windows, macOS, and Linux** built with **Tauri v2 + Vite + React 19 + TypeScript + Tailwind v4 + Zustand** (no Electron, no bundled Chromium).

---

## Local Development (Node / JavaScript Only — No Rust Required)

Every day-to-day UI and feature workflow runs in a standard browser using Vite + the browser fallback implementations in `src/platform/`:

```bash
cd desktop
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:1420`. In dev mode, `/api/v1` and `/health` are proxied automatically to `https://api.sabilearn.online` so you never hit CORS errors.

### Available Node-only scripts
- `npm run dev` — start Vite browser dev server on port `1420`
- `npm run build` — strict TypeScript check + production Vite bundle (`dist/`)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint 9 check
- `npm run test` — run Vitest unit & component tests
- `npm run tauri` — Tauri CLI passthrough (used in GitHub Actions CI)

---

## CI & Automated Releases (GitHub Actions)

You do **not** need Rust installed locally. Two GitHub Actions workflows handle everything:

1. **`.github/workflows/desktop-ci.yml`** — runs `typecheck`, `lint`, `test`, and `build` on every PR/push touching `desktop/`.
2. **`.github/workflows/desktop-release.yml`** — triggered by pushing a tag matching `desktop-v*` (or manual `workflow_dispatch`). Builds:
   - **Windows (`windows-latest`):** `.msi` + NSIS `.exe`
   - **macOS (`macos-latest`):** `.dmg` (Apple Silicon `aarch64` + Intel `x86_64`)
   - **Linux (`ubuntu-22.04`):** `.AppImage` + `.deb`
   - **Auto-updater manifest:** `latest.json` (Ed25519-signed)

### Generating Ed25519 Auto-Updater Keys (Node-only)

Run this once locally with Node (no Rust required):

```bash
cd desktop
npx tauri signer generate -w ~/.tauri/sabilearn.key
```

1. Copy the **public key** printed to stdout into `desktop/src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.
2. Add the contents of `~/.tauri/sabilearn.key` as a GitHub Actions Secret named `TAURI_SIGNING_PRIVATE_KEY`.
3. Add the password you chose (or empty string if none) as a GitHub Actions Secret named `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

### Cutting a Release

```bash
git tag desktop-v0.1.0
git push origin desktop-v0.1.0
```

GitHub Actions will create a draft release with all installers and `latest.json`. Review and publish the draft release.

---

## First-Run Notes for Unsigned v1 Installers

v1 ships unsigned builds (code signing & Apple notarization come later):

- **Windows (SmartScreen):** Click **More info** → **Run anyway**.
- **macOS (Gatekeeper):** Right-click `SabiLearn.app` → **Open** → **Open**, or run:
  ```bash
  xattr -cr /Applications/SabiLearn.app
  ```
- **Linux (YouTube Playback):** WebKitGTK uses system GStreamer for HTML5 video/YouTube embeds. Install:
  ```bash
  sudo apt-get install gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-libav
  ```
- **Linux (Nvidia / Wayland WebKitGTK Blank Window Workaround):** If the window renders blank on some Nvidia + Wayland setups, launch with:
  ```bash
  WEBKIT_DISABLE_DMABUF_RENDERER=1 ./SabiLearn.AppImage
  ```
