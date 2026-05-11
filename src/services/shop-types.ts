import { api } from "./api";
import type { MutationResponse, PageResponse } from "./common";

// ---------- Types ----------
export interface ShopTypeLocaleInput {
  locale_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface CreateShopTypeRequest {
  code: string;
  sort_order: number;
  locales?: ShopTypeLocaleInput[];
}

export interface UpdateShopTypeRequest {
  code: string;
  sort_order: number;
}

export interface ShopTypeLocale {
  id: number;
  shop_type_id?: number;
  locale_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface ShopType {
  id: number;
  code: string;
  sort_order: number;
  shop_type_locales: ShopTypeLocale[];
}

export interface ListShopTypesParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "code" | "sortOrder" | "createdAt";
  sort_dir?: "ASC" | "DESC";
}

export interface ListShopTypeLocalesParams {
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
export const shopTypesApi = {
  create: (body: CreateShopTypeRequest) =>
    api.post<MutationResponse>("/shop-types", body),

  list: (params: ListShopTypesParams = {}) =>
    api.get<PageResponse<ShopType>>(`/shop-types${buildQuery(params as Record<string, unknown>)}`),

  get: (id: number) =>
    api.get<{ shop_type: ShopType }>(`/shop-types/${id}`),

  update: (id: number, body: UpdateShopTypeRequest) =>
    api.put<MutationResponse>(`/shop-types/${id}`, body),

  delete: (id: number) =>
    api.delete<MutationResponse>(`/shop-types/${id}`),

  // Locales sub-resource
  locales: {
    add: (shopTypeId: number, body: ShopTypeLocaleInput) =>
      api.post<MutationResponse>(`/shop-types/${shopTypeId}/locales`, body),

    list: (shopTypeId: number, params: ListShopTypeLocalesParams = {}) =>
      api.get<PageResponse<ShopTypeLocale>>(
        `/shop-types/${shopTypeId}/locales${buildQuery(params as Record<string, unknown>)}`,
      ),

    get: (shopTypeId: number, id: number) =>
      api.get<{ shop_type_locale: ShopTypeLocale }>(
        `/shop-types/${shopTypeId}/locales/${id}`,
      ),

    update: (shopTypeId: number, id: number, body: ShopTypeLocaleInput) =>
      api.put<MutationResponse>(
        `/shop-types/${shopTypeId}/locales/${id}`,
        body,
      ),

    delete: (shopTypeId: number, id: number) =>
      api.delete<MutationResponse>(`/shop-types/${shopTypeId}/locales/${id}`),
  },
};