<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LyrikTrip Website (Vite + React) + Cloudflare Worker

This repo is a Vite + React static website. It is deployed via **Cloudflare Workers (Deploy from Git)**:
- Vite builds static assets into `dist/`
- A Worker serves those assets and exposes `/api/feishu` to forward form submissions to Feishu **without exposing the webhook URL in the browser**

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Deploy to Cloudflare Workers (Deploy from Git)

In the Cloudflare dashboard (the "Create a Worker" -> "Connect to Git" flow):

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

The deployment is configured by `wrangler.jsonc` and `src/worker.ts`.

### Environment variables (Cloudflare -> Worker -> Settings -> Variables)

These are used by the Worker to securely forward the form submission to Feishu without exposing your webhook URL in the browser:

- `FEISHU_WEBHOOK_URL`: your Feishu trigger webhook URL
- `ALLOWED_ORIGINS`: comma-separated allowed Origins (exact match), e.g.
  - `https://yourdomain.com,https://your-project.pages.dev,http://localhost:3000`

After setting env vars, deploy again to apply them.
