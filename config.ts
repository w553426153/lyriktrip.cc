// Runtime-config-like values for the static frontend.
// Note: because this site is deployed as static assets (dist/) behind nginx,
// changing these values requires rebuilding `dist/` and redeploying.

// WhatsApp uses a digits-only phone number in the `wa.me` URL.
// Replace this with your real butler WhatsApp number (E.164), e.g. "+8613712345678".
export const WHATSAPP_BUTLER_PHONE_E164 = '+8613800000000';

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hi! I'd like to chat with a Human Butler about planning my trip to China.";

/**
 * 手动配置：目的地详情页头图（Hero Image）的兜底图片。
 *
 * 使用规则：
 * - 若后端/数据库返回了 `destination.image`（cover_image_url），优先使用该值；
 * - 若 `destination.image` 为空/为 null，则按 `destination.id` 在此处查找手动配置；
 * - 若仍没有，则使用页面内置的全局 fallback 图。
 *
 * Key: destination id（与 `/api/v1/destinations/:id` 一致）
 * Value: 图片 URL（建议用 CDN/对象存储地址，或 Unsplash 等可直链图片）
 */
export const DESTINATION_HERO_IMAGE_FALLBACKS_BY_ID: Record<string, string> = {
  // 示例：
  // sh: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?auto=format&fit=crop&q=80&w=1600',
};

export function buildWhatsAppChatUrl(phoneE164: string, text?: string): string {
  const digits = String(phoneE164 || '').replace(/[^\d]/g, '');
  const base = `https://wa.me/${digits}`;
  const msg = typeof text === 'string' ? text.trim() : '';
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
}
