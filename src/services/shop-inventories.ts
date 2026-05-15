import { api } from "./api";
import type { MutationResponse, PageResponse } from "./common";
export type { MutationResponse, PageResponse };

export interface ShopInventoryLocaleInput {
  locale_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface CreateShopInventoryRequest {
  code: string;
  locales?: ShopInventoryLocaleInput[];
}

export interface UpdateShopInventoryRequest {
  code: string;
}

export interface ShopInventoryLocale {
  id: number;
  shop_inventory_id: number;
  locale_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface ShopInventoryItemStock {
  id: number;
  shop_inventory_id: number;
  shop_item_variant_id: number;
  available_quantity: number;
  reserved_quantity: number;
  damaged_quantity: number;
  reorder_level: number | null;
  max_stock_level: number | null;
}

export interface ItemVariantWithStock {
  id: number;
  shop_item_id: number;
  unit_id: number;
  code: string;
  sort_order: number;
  sku: string | null;
  barcode: string | null;
  quantity_value: number;
  shop_inventory_item: ShopInventoryItemStock | null;
}

export interface ShopItemWithVariants {
  id: number;
  shop_id: number;
  platform_item_id: number | null;
  code: string;
  is_custom: boolean;
  sort_order: number;
  shop_item_locales: Array<{
    id: number;
    locale_id: number;
    name: string;
    description: string;
    sort_order: number;
  }>;
  item_variants: ItemVariantWithStock[];
}

export interface ShopInventory {
  id: number;
  shop_id: number;
  code: string;
  shop_inventory_locales?: ShopInventoryLocale[];
  shop_items?: ShopItemWithVariants[] | null;
}

function buildQuery(params: Record<string, unknown> = {}): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export const shopInventoriesApi = {
  create: (shopId: number, body: CreateShopInventoryRequest) =>
    api.post<MutationResponse>(`/shops/${shopId}/inventory`, body),

  list: (shopId: number, params: Record<string, unknown> = {}) =>
    api.get<PageResponse<ShopInventory>>(
      `/shops/${shopId}/inventory${buildQuery(params)}`,
    ),

  get: (shopId: number, id: number) =>
    api.get<{ inventory: ShopInventory }>(`/shops/${shopId}/inventory/${id}`),

  update: (shopId: number, id: number, body: UpdateShopInventoryRequest) =>
    api.put<MutationResponse>(`/shops/${shopId}/inventory/${id}`, body),

  delete: (shopId: number, id: number) =>
    api.delete<MutationResponse>(`/shops/${shopId}/inventory/${id}`),

  locales: {
    list: (shopId: number, inventoryId: number, params: Record<string, unknown> = {}) =>
      api.get<PageResponse<ShopInventoryLocale>>(
        `/shops/${shopId}/inventory/${inventoryId}/locales${buildQuery(params)}`,
      ),

    get: (shopId: number, inventoryId: number, id: number) =>
      api.get<{ locale: ShopInventoryLocale }>(
        `/shops/${shopId}/inventory/${inventoryId}/locales/${id}`,
      ),

    add: (shopId: number, inventoryId: number, body: ShopInventoryLocaleInput) =>
      api.post<MutationResponse>(
        `/shops/${shopId}/inventory/${inventoryId}/locales`,
        body,
      ),

    update: (shopId: number, inventoryId: number, id: number, body: ShopInventoryLocaleInput) =>
      api.put<MutationResponse>(
        `/shops/${shopId}/inventory/${inventoryId}/locales/${id}`,
        body,
      ),

    delete: (shopId: number, inventoryId: number, id: number) =>
      api.delete<MutationResponse>(
        `/shops/${shopId}/inventory/${inventoryId}/locales/${id}`,
      ),
  },
};
