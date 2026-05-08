import { api } from "./api";
import type { MutationResponse, PageResponse } from "./common";

export interface PlatformItemCategoryLocale {
  id: number;
  locale_id: number;
  name: string;
  description: string;
}

export interface PlatformItemCategory {
  id: number;
  code: string;
  parent_id?: number | null;
  sub_category_count?: number;
  platform_item_category_locales?: PlatformItemCategoryLocale[];
}

function qs(params: Record<string, unknown> = {}): string {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return s ? `?${s}` : "";
}

export const platformItemCategoriesApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get<PageResponse<PlatformItemCategory>>(
      `/platform-item-categories${qs(params)}`,
    ),
  listRoot: (params: Record<string, unknown> = {}) =>
    api.get<PageResponse<PlatformItemCategory>>(
      `/platform-item-categories/root${qs(params)}`,
    ),
  listSubCategories: (id: number, params: Record<string, unknown> = {}) =>
    api.get<PageResponse<PlatformItemCategory>>(
      `/platform-item-categories/${id}/sub-categories${qs(params)}`,
    ),
  get: (id: number) =>
    api.get<{ platform_item_category: PlatformItemCategory }>(
      `/platform-item-categories/${id}`,
    ),
  create: (body: unknown) =>
    api.post<MutationResponse>(`/platform-item-categories`, body),
};

