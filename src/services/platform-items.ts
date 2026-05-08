import { api } from "./api";
import type { MutationResponse, PageResponse } from "./common";

export interface PlatformItemLocale {
  id: number;
  locale_id: number;
  name: string;
  description: string;
}

export interface PlatformItemVariant {
  id: number;
  platform_item_id: number;
  code: string;
  sort_order: number;
  quantity_value: number;
}

export interface PlatformItem {
  id: number;
  code: string;
  platform_item_category_id?: number | null;
  platform_item_locales?: PlatformItemLocale[];
  platform_item_variants?: PlatformItemVariant[];
}

function qs(params: Record<string, unknown> = {}): string {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return s ? `?${s}` : "";
}

export const platformItemsApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get<PageResponse<PlatformItem>>(`/platform-items${qs(params)}`),

  get: (id: number) =>
    api.get<{ platform_item: PlatformItem }>(`/platform-items/${id}`),

  create: (body: unknown) =>
    api.post<MutationResponse>(`/platform-items`, body),

  variants: {
    list: (itemId: number, params: Record<string, unknown> = {}) =>
      api.get<PageResponse<PlatformItemVariant>>(
        `/platform-items/${itemId}/variants${qs(params)}`,
      ),
  },
};
