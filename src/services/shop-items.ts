import { api } from "./api";
import type { MutationResponse, PageResponse } from "./common";
export type { MutationResponse, PageResponse };

export interface ShopItemLocaleInput {
  locale_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface ShopItemVariantInput {
  code: string;
  sort_order: number;
  sku?: string;
  barcode?: string;
  quantity_value: number;
  shop_inventory_items?: Record<string, {
    available_quantity: number;
    reserved_quantity: number;
    damaged_quantity: number;
    reorder_level?: number | null;
    max_stock_level?: number | null;
  }>;
}

export interface CreateShopItemRequest {
  code: string;
  platform_item_id?: number | null;
  is_custom: boolean;
  sort_order: number;
  locales?: ShopItemLocaleInput[];
  variants?: ShopItemVariantInput[];
}

export interface UpdateShopItemRequest {
  code: string;
  platform_item_id?: number | null;
  is_custom: boolean;
  sort_order: number;
}

export interface ShopItemLocale {
  id: number;
  locale_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface ShopItem {
  id: number;
  shop_id?: number;
  code: string;
  platform_item_id?: number | null;
  is_custom: boolean;
  sort_order: number;
  shop_item_locales?: ShopItemLocale[];
}

export interface ShopItemVariant {
  id: number;
  shop_item_id: number;
  code: string;
  sort_order: number;
  quantity_value: number;
  sku?: string | null;
  barcode?: string | null;
}

function buildQuery(params: Record<string, unknown> = {}): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export const shopItemsApi = {
  create: (shopId: number, body: CreateShopItemRequest) =>
    api.post<MutationResponse>(`/shops/${shopId}/items`, body),

  list: (shopId: number, params: Record<string, unknown> = {}) =>
    api.get<PageResponse<ShopItem>>(
      `/shops/${shopId}/items${buildQuery(params)}`,
    ),

  get: (shopId: number, id: number) =>
    api.get<{ shop_item: ShopItem }>(`/shops/${shopId}/items/${id}`),

  update: (shopId: number, id: number, body: UpdateShopItemRequest) =>
    api.put<MutationResponse>(`/shops/${shopId}/items/${id}`, body),

  delete: (shopId: number, id: number) =>
    api.delete<MutationResponse>(`/shops/${shopId}/items/${id}`),

  variants: {
    list: (shopId: number, itemId: number, params: Record<string, unknown> = {}) =>
      api.get<PageResponse<ShopItemVariant>>(
        `/shops/${shopId}/items/${itemId}/variants${buildQuery(params)}`,
      ),
  },

  locales: {
    list: (shopId: number, itemId: number, params: Record<string, unknown> = {}) =>
      api.get<PageResponse<ShopItemLocale>>(
        `/shops/${shopId}/items/${itemId}/locales${buildQuery(params)}`,
      ),

    add: (shopId: number, itemId: number, body: ShopItemLocaleInput) =>
      api.post<MutationResponse>(`/shops/${shopId}/items/${itemId}/locales`, body),

    update: (shopId: number, itemId: number, id: number, body: ShopItemLocaleInput) =>
      api.put<MutationResponse>(`/shops/${shopId}/items/${itemId}/locales/${id}`, body),

    delete: (shopId: number, itemId: number, id: number) =>
      api.delete<MutationResponse>(`/shops/${shopId}/items/${itemId}/locales/${id}`),
  },
};
