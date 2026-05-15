"use client";

import { useEffect, useState } from "react";
import { Check, FolderTree, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocaleId } from "@/lib/use-locale-id";
import { itemCategoriesApi, type ShopItemCategory } from "@/services/item-categories";
import { itemCategoryAssignmentsApi } from "@/services/item-category-assignments";
import type { ShopItem } from "@/services/shop-items";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: number;
  item: ShopItem | null;
}

export function AssignCategoriesDialog({ open, onOpenChange, shopId, item }: Props) {
  const { t } = useTranslation();
  const localeId = useLocaleId();

  const [categories, setCategories] = useState<ShopItemCategory[]>([]);
  const [loading, setLoading] = useState(false);
  // Set of category IDs this item is currently assigned to (toggled live)
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  // Set of category IDs with an in-flight API call
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open || !shopId) return;
    setLoading(true);
    setAssignedIds(new Set());
    itemCategoriesApi
      .list(shopId, { size: 50, sort_by: "id", sort_dir: "ASC" })
      .then((res) => setCategories(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [open, shopId]);

  if (!item) return null;

  const localized = (c: ShopItemCategory) => {
    const list = c.locales ?? [];
    return (
      list.find((l) => l.locale_id === localeId)?.name ||
      list[0]?.name ||
      c.code
    );
  };

  const toggle = async (category: ShopItemCategory) => {
    if (pendingIds.has(category.id)) return;
    const isAssigned = assignedIds.has(category.id);

    setPendingIds((s) => new Set(s).add(category.id));
    try {
      if (isAssigned) {
        await itemCategoryAssignmentsApi.unassign(shopId, category.id, item.id);
        setAssignedIds((s) => {
          const n = new Set(s);
          n.delete(category.id);
          return n;
        });
        toast.success(
          t("shopItem.unassignedToast", "Item unassigned from category"),
          { description: localized(category) },
        );
      } else {
        await itemCategoryAssignmentsApi.assign(shopId, category.id, item.id, 1);
        setAssignedIds((s) => new Set(s).add(category.id));
        toast.success(
          t("shopItem.assignedToast", "Item assigned to category"),
          { description: localized(category) },
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setPendingIds((s) => {
        const n = new Set(s);
        n.delete(category.id);
        return n;
      });
    }
  };

  const itemName =
    item.shop_item_locales?.find((l) => l.locale_id === localeId)?.name ||
    item.shop_item_locales?.[0]?.name ||
    item.code;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            {t("shopItem.assignCategories", "Assign to Categories")}
          </DialogTitle>
          <DialogDescription>
            {t("shopItem.assignCategoriesDesc", "Toggle categories to assign or unassign")} —{" "}
            <span className="font-medium text-foreground">{itemName}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t("shopItem.noCategoriesAvailable", "No categories available.")}
          </p>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => {
              const isAssigned = assignedIds.has(cat.id);
              const isPending = pendingIds.has(cat.id);
              return (
                <li
                  key={cat.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium">{localized(cat)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cat.code}
                      {cat.parent_id && (
                        <span className="ml-1 text-muted-foreground/60">
                          · ID #{cat.parent_id}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={isAssigned ? "secondary" : "outline"}
                    disabled={isPending}
                    onClick={() => toggle(cat)}
                    className="shrink-0"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isAssigned ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        {t("shopItem.unassign", "Unassign")}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        {t("shopItem.assign", "Assign")}
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant="secondary">
            {assignedIds.size} {t("shopItem.assigned", "assigned")}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="mr-1.5 h-3.5 w-3.5" />
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
