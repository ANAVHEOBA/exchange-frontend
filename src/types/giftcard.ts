export interface GiftCardProduct {
  product_id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  terms_and_conditions?: string | null;
  how_to_use?: string | null;
  expiry_and_validity?: string | null;
  card_image_url?: string | null;
  country?: string | null;
  min_amount?: number | null;
  max_amount?: number | null;
  denominations?: number[] | null;
}

export interface GiftCardCatalogResponse {
  country?: string | null;
  cards: GiftCardProduct[];
}

export interface GiftCardCatalogQuery {
  country?: string;
}

export interface CreateGiftCardOrderRequest {
  product_id: string;
  ticker_from: string;
  network_from: string;
  amount: number;
  email: string;
  webhook?: string;
  webhook_key?: string;
  card_markup?: string;
}

export interface GiftCardOrderDetails {
  hashout?: string | null;
  id?: string | null;
  email?: string | null;
  status?: string | null;
  value?: string | null;
  activation_link?: string | null;
  redeem_code?: string | null;
  extra: Record<string, unknown>;
}

export interface GiftCardOrderResponse {
  order_id: string;
  trade_id?: string | null;
  order_kind: string;
  product_id?: string | null;
  prepaid_provider?: string | null;
  currency_code?: string | null;
  provider?: string | null;
  provider_trade_id?: string | null;
  provider_password?: string | null;
  status: string;
  ticker_from: string;
  network_from: string;
  ticker_to?: string | null;
  network_to?: string | null;
  coin_from?: string | null;
  coin_to?: string | null;
  amount_from: number;
  amount_to?: number | null;
  fixed?: boolean | null;
  payment?: boolean | null;
  deposit_address?: string | null;
  deposit_extra_id?: string | null;
  settlement_address?: string | null;
  settlement_extra_id?: string | null;
  refund_address?: string | null;
  refund_extra_id?: string | null;
  queued: boolean;
  retryable: boolean;
  last_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
  details?: GiftCardOrderDetails | null;
}
