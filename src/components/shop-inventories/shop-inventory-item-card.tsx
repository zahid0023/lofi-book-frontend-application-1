import { Boxes, Eye, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ShopInventoryItem } from "@/services/shop-inventory-items";

interface Props {
  item: ShopInventoryItem;
  onView?: (item: ShopInventoryItem) => void;
  onEdit?: (item: ShopInventoryItem) => void;
  onDelete?: (item: ShopInventoryItem) => void;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function ShopInventoryItemCard({ item, onView, onEdit, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <Card className="group flex h-full flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-400 text-white shadow-md">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="truncate text-base font-semibold leading-tight">
              {t("shopInventoryItem.variantLabel", { id: item.shop_item_variant_id })}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {t("shopInventoryItem.inventoryItemId", { id: item.id })}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          #{item.shop_inventory_id}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-center text-xs">
        <div>
          <p className="font-medium text-foreground">{fmt(item.available_quantity)}</p>
          <p className="text-muted-foreground">{t("shopInventoryItem.available")}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">{fmt(item.reserved_quantity)}</p>
          <p className="text-muted-foreground">{t("shopInventoryItem.reserved")}</p>
        </div>
        <div>
          <p className="font-medium text-amber-600 dark:text-amber-400">{fmt(item.damaged_quantity)}</p>
          <p className="text-muted-foreground">{t("shopInventoryItem.damaged")}</p>
        </div>
      </div>

      {(item.reorder_level != null || item.max_stock_level != null) && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {item.reorder_level != null && (
            <span>
              {t("shopInventoryItem.reorderLevel")}: <strong>{fmt(item.reorder_level)}</strong>
            </span>
          )}
          {item.max_stock_level != null && (
            <span>
              {t("shopInventoryItem.maxStockLevel")}: <strong>{fmt(item.max_stock_level)}</strong>
            </span>
          )}
        </div>
      )}

      {(onView || onEdit || onDelete) && (
        <div className="mt-auto flex items-center justify-end gap-1 border-t border-border/60 pt-3">
          {onView && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onView(item)}
              aria-label="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item)}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item)}
              aria-label="Delete"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
