"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  shopInventoryItemsApi,
  type ShopInventoryItem,
} from "@/services/shop-inventory-items";

export type InventoryItemDialogMode = "create" | "edit" | "view";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: InventoryItemDialogMode;
  onModeChange: (mode: InventoryItemDialogMode) => void;
  shopId: number;
  inventoryId: number;
  initial?: ShopInventoryItem;
  onSaved: (saved: ShopInventoryItem) => void;
}

interface FormState {
  shop_item_variant_id: string;
  available_quantity: string;
  reserved_quantity: string;
  damaged_quantity: string;
  reorder_level: string;
  max_stock_level: string;
}

const empty: FormState = {
  shop_item_variant_id: "",
  available_quantity: "",
  reserved_quantity: "",
  damaged_quantity: "",
  reorder_level: "",
  max_stock_level: "",
};

function toForm(item: ShopInventoryItem): FormState {
  return {
    shop_item_variant_id: String(item.shop_item_variant_id),
    available_quantity: String(item.available_quantity),
    reserved_quantity: String(item.reserved_quantity),
    damaged_quantity: String(item.damaged_quantity),
    reorder_level: item.reorder_level != null ? String(item.reorder_level) : "",
    max_stock_level: item.max_stock_level != null ? String(item.max_stock_level) : "",
  };
}

export function ShopInventoryItemDialog({
  open,
  onOpenChange,
  mode,
  onModeChange,
  shopId,
  inventoryId,
  initial,
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(empty);
  const [submitting, setSubmitting] = useState(false);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const fieldsDisabled = isView || submitting;

  useEffect(() => {
    if (!open) return;
    if ((isEdit || isView) && initial) {
      setForm(toForm(initial));
    } else {
      setForm(empty);
    }
  }, [open, mode, initial?.id]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const reorderLevel = form.reorder_level !== "" ? parseFloat(form.reorder_level) : null;
    const maxStockLevel = form.max_stock_level !== "" ? parseFloat(form.max_stock_level) : null;

    if (mode === "create") {
      if (form.available_quantity === "") {
        toast.error(t("shopInventoryItem.errAvailableQty"));
        return;
      }
      if (form.reserved_quantity === "") {
        toast.error(t("shopInventoryItem.errReservedQty"));
        return;
      }
      if (form.damaged_quantity === "") {
        toast.error(t("shopInventoryItem.errDamagedQty"));
        return;
      }
      if (reorderLevel === null) {
        toast.error(t("shopInventoryItem.errReorderLevel"));
        return;
      }
      if (maxStockLevel === null) {
        toast.error(t("shopInventoryItem.errMaxStockLevel"));
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isEdit && initial) {
        await shopInventoryItemsApi.update(shopId, inventoryId, initial.id, {
          reorder_level: reorderLevel,
          max_stock_level: maxStockLevel,
        });
        toast.success(t("shopInventoryItem.updatedToast"));
        onSaved({ ...initial, reorder_level: reorderLevel, max_stock_level: maxStockLevel });
        onOpenChange(false);
      } else {
        const variantId = parseInt(form.shop_item_variant_id, 10);
        if (!variantId || variantId <= 0) {
          toast.error(t("shopInventoryItem.errVariantId"));
          setSubmitting(false);
          return;
        }
        const availableQty = parseFloat(form.available_quantity);
        const reservedQty = parseFloat(form.reserved_quantity);
        const damagedQty = parseFloat(form.damaged_quantity);
        const res = await shopInventoryItemsApi.create(shopId, inventoryId, {
          shop_item_variant_id: variantId,
          available_quantity: availableQty,
          reserved_quantity: reservedQty,
          damaged_quantity: damagedQty,
          reorder_level: reorderLevel,
          max_stock_level: maxStockLevel,
        });
        toast.success(t("shopInventoryItem.createdToast"));
        onSaved({
          id: res.id,
          shop_inventory_id: inventoryId,
          shop_item_variant_id: variantId,
          available_quantity: availableQty,
          reserved_quantity: reservedQty,
          damaged_quantity: damagedQty,
          reorder_level: reorderLevel,
          max_stock_level: maxStockLevel,
        });
        onOpenChange(false);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const titleKey =
    mode === "create" ? "shopInventoryItem.titleCreate"
    : mode === "edit" ? "shopInventoryItem.titleEdit"
    : "shopInventoryItem.titleView";

  const descKey =
    mode === "create" ? "shopInventoryItem.dialogDesc"
    : mode === "edit" ? "shopInventoryItem.dialogDescEdit"
    : "shopInventoryItem.dialogDescView";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t(descKey)}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Variant ID — create mode only */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>{t("shopInventoryItem.variantId")}</Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={form.shop_item_variant_id}
                onChange={set("shop_item_variant_id")}
                disabled={fieldsDisabled}
                placeholder="e.g. 1"
              />
            </div>
          )}

          {/* Stock quantities — create mode */}
          {mode === "create" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("shopInventoryItem.available")}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.001"
                  value={form.available_quantity}
                  onChange={set("available_quantity")}
                  disabled={submitting}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("shopInventoryItem.reserved")}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.001"
                  value={form.reserved_quantity}
                  onChange={set("reserved_quantity")}
                  disabled={submitting}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("shopInventoryItem.damaged")}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.001"
                  value={form.damaged_quantity}
                  onChange={set("damaged_quantity")}
                  disabled={submitting}
                  placeholder="0"
                  required
                />
              </div>
            </div>
          )}

          {/* Read-only stock quantities — view/edit mode */}
          {(isView || isEdit) && initial && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t("shopInventoryItem.stockQuantities", "Stock quantities (read-only)")}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("shopInventoryItem.available")}</Label>
                  <p className="text-sm font-mono font-medium">{initial.available_quantity}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("shopInventoryItem.reserved")}</Label>
                  <p className="text-sm font-mono font-medium">{initial.reserved_quantity}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("shopInventoryItem.damaged")}</Label>
                  <p className="text-sm font-mono font-medium">{initial.damaged_quantity}</p>
                </div>
              </div>
            </div>
          )}

          {/* Reorder level & max stock level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("shopInventoryItem.reorderLevel")}</Label>
              <Input
                type="number"
                min={0}
                step="0.001"
                value={form.reorder_level}
                onChange={set("reorder_level")}
                disabled={fieldsDisabled}
                placeholder="—"
                required={mode === "create"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("shopInventoryItem.maxStockLevel")}</Label>
              <Input
                type="number"
                min={0}
                step="0.001"
                value={form.max_stock_level}
                onChange={set("max_stock_level")}
                disabled={fieldsDisabled}
                placeholder="—"
                required={mode === "create"}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {isView ? (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.close")}
                </Button>
                <Button type="button" onClick={() => onModeChange("edit")}>
                  <Pencil className="mr-2 h-4 w-4" /> {t("common.edit")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 text-white",
                    "hover:brightness-110",
                  )}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? t("common.save") : t("shopInventoryItem.create")}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
