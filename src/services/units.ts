import { api } from "./api";
import type { PageResponse } from "./common";

export interface Unit {
  id: number;
  code: string;
  name: string;
}

function buildQuery(params: Record<string, unknown> = {}): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export const unitsApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get<PageResponse<Unit>>(`/units${buildQuery(params)}`),

  get: (id: number) =>
    api.get<{ unit: Unit }>(`/units/${id}`),
};
