// Runtime-config-like values for the static frontend.
// Note: because this site is deployed as static assets (dist/) behind nginx,
// changing these values requires rebuilding `dist/` and redeploying.

// WhatsApp uses a digits-only phone number in the `wa.me` URL.
// Replace this with your real butler WhatsApp number (E.164), e.g. "+8613712345678".
export const WHATSAPP_BUTLER_PHONE_E164 = '+8613800000000';

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hi! I'd like to chat with a Human Butler about planning my trip to China.";

export function buildWhatsAppChatUrl(phoneE164: string, text?: string): string {
  const digits = String(phoneE164 || '').replace(/[^\d]/g, '');
  const base = `https://wa.me/${digits}`;
  const msg = typeof text === 'string' ? text.trim() : '';
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
}

