import { api } from "./api";
import type { MutationResponse, PageResponse } from "./common";
export type { MutationResponse, PageResponse };

export interface ShopInventoryItem {
  id: number;
  shop_inventory_id: number;
  shop_item_variant_id: number;
  available_quantity: number;
  reserved_quantity: number;
  damaged_quantity: number;
  reorder_level?: number | null;
  max_stock_level?: number | null;
}

export interface CreateShopInventoryItemRequest {
  shop_item_variant_id: number;
  available_quantity: number;
  reserved_quantity: number;
  damaged_quantity: number;
  reorder_level?: number | null;
  max_stock_level?: number | null;
}

export interface UpdateShopInventoryItemRequest {
  reorder_level?: number | null;
  max_stock_level?: number | null;
}

function buildQuery(params: Record<string, unknown> = {}): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export const shopInventoryItemsApi = {
  create: (shopId: number, inventoryId: number, body: CreateShopInventoryItemRequest) =>
    api.post<MutationResponse>(`/shops/${shopId}/inventory/${inventoryId}/items`, body),

  list: (shopId: number, inventoryId: number, params: Record<string, unknown> = {}) =>
    api.get<PageResponse<ShopInventoryItem>>(
      `/shops/${shopId}/inventory/${inventoryId}/items${buildQuery(params)}`,
    ),

  get: (shopId: number, inventoryId: number, id: number) =>
    api.get<{ item: ShopInventoryItem }>(
      `/shops/${shopId}/inventory/${inventoryId}/items/${id}`,
    ),

  update: (shopId: number, inventoryId: number, id: number, body: UpdateShopInventoryItemRequest) =>
    api.put<MutationResponse>(`/shops/${shopId}/inventory/${inventoryId}/items/${id}`, body),

  delete: (shopId: number, inventoryId: number, id: number) =>
    api.delete<MutationResponse>(`/shops/${shopId}/inventory/${inventoryId}/items/${id}`),
};
