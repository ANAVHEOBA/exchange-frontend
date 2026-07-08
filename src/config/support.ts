const SELL_GIFTCARD_WHATSAPP_DISPLAY = '08160899603';
const SELL_GIFTCARD_WHATSAPP_DIGITS = '2348160899603';
const SWAP_BOT_WHATSAPP_DISPLAY = '+1 555-162-2552';
const SWAP_BOT_WHATSAPP_DIGITS = '15551622552';

const SELL_GIFTCARD_WHATSAPP_TEMPLATE = 'hey i want to sell a giftcard';
const SWAP_BOT_WHATSAPP_TEMPLATE = 'swap';

export const SUPPORT_CONFIG = {
  sellGiftcardWhatsappDisplay: SELL_GIFTCARD_WHATSAPP_DISPLAY,
  sellGiftcardWhatsappDigits: SELL_GIFTCARD_WHATSAPP_DIGITS,
  sellGiftcardWhatsappHref: `https://wa.me/${SELL_GIFTCARD_WHATSAPP_DIGITS}?text=${encodeURIComponent(SELL_GIFTCARD_WHATSAPP_TEMPLATE)}`,
  swapBotWhatsappDisplay: SWAP_BOT_WHATSAPP_DISPLAY,
  swapBotWhatsappDigits: SWAP_BOT_WHATSAPP_DIGITS,
  swapBotWhatsappHref: `https://wa.me/${SWAP_BOT_WHATSAPP_DIGITS}?text=${encodeURIComponent(SWAP_BOT_WHATSAPP_TEMPLATE)}`,
  swapBotIsTest: true,
} as const;
