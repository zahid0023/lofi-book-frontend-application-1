import { api } from "./api";
import type { MutationResponse, PageResponse } from "./common";
export type { MutationResponse, PageResponse };

// ---------- Types ----------
export interface ShopItemCategoryLocaleInput {
  locale_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface CreateShopItemCategoryRequest {
  code: string;
  platform_category_id: number;
  parent_id?: number | null;
  sort_order: number;
  locales?: ShopItemCategoryLocaleInput[];
}

export interface UpdateShopItemCategoryRequest {
  code: string;
  platform_category_id: number;
  parent_id?: number | null;
  sort_order: number;
}

export interface ShopItemCategoryLocale {
  id: number;
  locale_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface ShopItemSummary {
  id: number;
  shop_id: number;
  platform_item_id?: number | null;
  code: string;
  is_custom: boolean;
  sort_order: number;
  shop_item_locales?: Array<{
    id: number;
    locale_id: number;
    name: string;
    description: string;
    sort_order: number;
  }>;
}

export interface ShopItemCategory {
  id: number;
  shop_id?: number;
  code: string;
  platform_category_id: number;
  parent_id?: number | null;
  sort_order: number;
  locales?: ShopItemCategoryLocale[];
  sub_categories?: ShopItemCategory[];
  shop_items?: ShopItemSummary[];
}

export interface ListShopItemCategoriesParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "code" | "sortOrder" | "createdAt";
  sort_dir?: "ASC" | "DESC";
}

export interface ListShopItemCategoryLocalesParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "name" | "sortOrder" | "createdAt";
  sort_dir?: "ASC" | "DESC";
}

function buildQuery(params: Record<string, unknown> | object = {}): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

// ---------- API ----------
export const itemCategoriesApi = {
  create: (shopId: number, body: CreateShopItemCategoryRequest) =>
    api.post<MutationResponse>(`/shops/${shopId}/item-categories`, body),

  list: (shopId: number, params: ListShopItemCategoriesParams = {}) =>
    api.get<PageResponse<ShopItemCategory>>(
      `/shops/${shopId}/item-categories${buildQuery(params as Record<string, unknown>)}`,
    ),

  get: (shopId: number, id: number) =>
    api.get<{ shop_item_category: ShopItemCategory }>(
      `/shops/${shopId}/item-categories/${id}`,
    ),

  update: (shopId: number, id: number, body: UpdateShopItemCategoryRequest) =>
    api.put<MutationResponse>(`/shops/${shopId}/item-categories/${id}`, body),

  delete: (shopId: number, id: number) =>
    api.delete<MutationResponse>(`/shops/${shopId}/item-categories/${id}`),

  locales: {
    list: (shopId: number, categoryId: number, params: ListShopItemCategoryLocalesParams = {}) =>
      api.get<PageResponse<ShopItemCategoryLocale>>(
        `/shops/${shopId}/item-categories/${categoryId}/locales${buildQuery(params as Record<string, unknown>)}`,
      ),

    get: (shopId: number, categoryId: number, id: number) =>
      api.get<{ shop_item_category_locale: ShopItemCategoryLocale }>(
        `/shops/${shopId}/item-categories/${categoryId}/locales/${id}`,
      ),

    add: (shopId: number, categoryId: number, body: ShopItemCategoryLocaleInput) =>
      api.post<MutationResponse>(
        `/shops/${shopId}/item-categories/${categoryId}/locales`,
        body,
      ),

    update: (shopId: number, categoryId: number, id: number, body: ShopItemCategoryLocaleInput) =>
      api.put<MutationResponse>(
        `/shops/${shopId}/item-categories/${categoryId}/locales/${id}`,
        body,
      ),

    delete: (shopId: number, categoryId: number, id: number) =>
      api.delete<MutationResponse>(
        `/shops/${shopId}/item-categories/${categoryId}/locales/${id}`,
      ),
  },

  items: {
    assign: (shopId: number, categoryId: number, body: { shop_item_id: number; sort_order: number }) =>
      api.post<MutationResponse>(`/shops/${shopId}/item-categories/${categoryId}`, body),

    unassign: (shopId: number, categoryId: number, shopItemId: number) =>
      api.delete<MutationResponse>(
        `/shops/${shopId}/item-categories/${categoryId}/${shopItemId}`,
      ),
  },
};
