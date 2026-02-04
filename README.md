<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LyrikTrip Website (Vite + React)

This repo is a Vite + React static website, deployed on Cloudflare Pages.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Deploy to Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`

### Environment variables (Cloudflare Pages -> Settings -> Environment variables)

These are used by Pages Functions to securely forward the form submission to Feishu without exposing your webhook URL in the browser:

- `FEISHU_WEBHOOK_URL`: your Feishu trigger webhook URL
- `ALLOWED_ORIGINS`: comma-separated allowed Origins (exact match), e.g.
  - `https://yourdomain.com,https://your-project.pages.dev,http://localhost:3000`

After setting env vars, deploy again to apply them.
