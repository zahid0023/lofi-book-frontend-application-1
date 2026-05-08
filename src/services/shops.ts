import { api } from "./api";
import type { MutationResponse, PageResponse } from "./common";
export type { MutationResponse, PageResponse };

// ---------- Types ----------
export interface ShopLocaleInput {
  locale_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface CreateShopRequest {
  code: string;
  shop_type_id: number;
  sort_order: number;
  locales?: ShopLocaleInput[];
}

export interface UpdateShopRequest {
  code: string;
  shop_type_id: number;
  sort_order: number;
}

export interface ShopTypeLocaleEmbedded {
  id: number;
  locale_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface ShopTypeEmbedded {
  id: number;
  code: string;
  sort_order: number;
  shop_type_locales?: ShopTypeLocaleEmbedded[];
}

export interface ShopLocaleEmbedded {
  id: number;
  locale_id: number;
  name: string;
  description: string;
  sort_order: number;
}

/** Full locale record returned by the locales sub-resource. */
export type ShopLocale = ShopLocaleEmbedded;

export interface Shop {
  id: number;
  code: string;
  shop_type?: ShopTypeEmbedded;
  /** Not present in API response — derived from shop_type.id where needed. */
  shop_type_id?: number;
  sort_order: number;
  shop_locales?: ShopLocaleEmbedded[];
}

export interface ListShopLocalesParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "name" | "sortOrder" | "createdAt";
  sort_dir?: "ASC" | "DESC";
}

export interface ListShopsParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "code" | "sortOrder" | "createdAt";
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
export const shopsApi = {
  create: (body: CreateShopRequest) =>
    api.post<MutationResponse>("/shops", body),

  list: (params: ListShopsParams = {}) =>
    api.get<PageResponse<Shop>>(`/shops${buildQuery(params as Record<string, unknown>)}`),

  get: (id: number) =>
    api.get<{ shop: Shop }>(`/shops/${id}`),

  update: (id: number, body: UpdateShopRequest) =>
    api.put<MutationResponse>(`/shops/${id}`, body),

  delete: (id: number) =>
    api.delete<MutationResponse>(`/shops/${id}`),

  locales: {
    list: (shopId: number, params: ListShopLocalesParams = {}) =>
      api.get<PageResponse<ShopLocale>>(
        `/shops/${shopId}/locales${buildQuery(params as Record<string, unknown>)}`,
      ),

    get: (shopId: number, id: number) =>
      api.get<{ shop_locale: ShopLocale }>(`/shops/${shopId}/locales/${id}`),

    add: (shopId: number, body: ShopLocaleInput) =>
      api.post<MutationResponse>(`/shops/${shopId}/locales`, body),

    update: (shopId: number, id: number, body: ShopLocaleInput) =>
      api.put<MutationResponse>(`/shops/${shopId}/locales/${id}`, body),

    delete: (shopId: number, id: number) =>
      api.delete<MutationResponse>(`/shops/${shopId}/locales/${id}`),
  },
};
