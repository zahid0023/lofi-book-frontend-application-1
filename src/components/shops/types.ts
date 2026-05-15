import type { Shop } from "@/services/shops";
import type { Locale } from "@/services/locales";

export type { Shop };

export type ShopDialogMode = "create" | "edit" | "view";

export interface ShopCardProps {
  shop: Shop;
  defaultName?: string;
  defaultDescription?: string;
  /** Triggered when the card body is clicked (navigate to the shop portal). */
  onOpen?: (shop: Shop) => void;
  onView?: (shop: Shop) => void;
  onEdit?: (shop: Shop) => void;
  onDelete?: (shop: Shop) => void;
}

export interface ShopLocaleRow {
  /** Existing entry id — undefined for newly-added rows. */
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  /** True for rows added in the dialog that haven't been persisted yet. */
  _new?: boolean;
}

export interface InventoryLocaleRow {
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
}

export interface InventoryRow {
  code: string;
  locales: InventoryLocaleRow[];
}

export interface ShopFormState {
  code: string;
  shop_type_id: number | "";
  sort_order: number;
  locales: ShopLocaleRow[];
  inventories: InventoryRow[];
}

export const emptyShopForm: ShopFormState = {
  code: "",
  shop_type_id: "",
  sort_order: 1,
  locales: [],
  inventories: [{ code: "MAIN_INVENTORY", locales: [] }],
};

export interface ShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ShopDialogMode;
  onModeChange?: (mode: ShopDialogMode) => void;
  /** Shop id when editing/viewing. */
  shopId?: number;
  form: ShopFormState;
  onFormChange: (form: ShopFormState) => void;
  /** Languages available for translations. */
  availableLocales?: Locale[];
  onSaved?: (shop: Shop) => void | Promise<void>;
}
