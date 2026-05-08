import { api } from "./api";
import type { MutationResponse } from "./common";

export const itemCategoryAssignmentsApi = {
  assign: (
    shopId: number,
    categoryId: number,
    shopItemId: number,
    sortOrder: number,
  ) =>
    api.post<MutationResponse>(
      `/shops/${shopId}/item-categories/${categoryId}`,
      { shop_item_id: shopItemId, sort_order: sortOrder },
    ),

  unassign: (shopId: number, categoryId: number, shopItemId: number) =>
    api.delete<MutationResponse>(
      `/shops/${shopId}/item-categories/${categoryId}/${shopItemId}`,
    ),
};
