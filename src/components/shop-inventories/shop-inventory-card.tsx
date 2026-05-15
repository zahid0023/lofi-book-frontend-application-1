import { Eye, Pencil, Trash2, Warehouse } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ShopInventory } from "@/services/shop-inventories";

interface Props {
  inventory: ShopInventory;
  defaultName?: string;
  defaultDescription?: string;
  onViewItems?: (inventory: ShopInventory) => void;
  onView?: (inventory: ShopInventory) => void;
  onEdit?: (inventory: ShopInventory) => void;
  onDelete?: (inventory: ShopInventory) => void;
}

export function ShopInventoryCard({
  inventory,
  defaultName,
  defaultDescription,
  onViewItems,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const title = defaultName?.trim() || inventory.code || `Inventory #${inventory.id}`;
  const localeCount = inventory.shop_inventory_locales?.length ?? 0;

  return (
    <Card className="group flex h-full flex-col transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <button
        type="button"
        onClick={() => onViewItems?.(inventory)}
        disabled={!onViewItems}
        className="flex flex-col gap-3 p-5 text-left disabled:cursor-default"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400 text-white shadow-md">
              <Warehouse className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h3 className="truncate text-base font-semibold leading-tight">{title}</h3>
              <p className="truncate text-xs text-muted-foreground">
                {inventory.code} · ID #{inventory.id}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {localeCount} {localeCount === 1 ? t("shopInventory.locale") : t("shopInventory.locales")}
          </span>
        </div>

        {defaultDescription ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{defaultDescription}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground/70">{t("shopInventory.noDescription")}</p>
        )}
      </button>

      {(onView || onEdit || onDelete) && (
        <div className="mt-auto flex items-center justify-end gap-1 border-t border-border/60 px-5 py-3">
          {onView && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onView(inventory)}
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
              onClick={() => onEdit(inventory)}
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
              onClick={() => onDelete(inventory)}
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
