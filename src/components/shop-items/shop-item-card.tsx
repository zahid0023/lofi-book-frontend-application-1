import { Eye, FolderTree, Package, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ShopItem } from "@/services/shop-items";

interface Props {
  item: ShopItem;
  defaultName?: string;
  defaultDescription?: string;
  onView?: (item: ShopItem) => void;
  onEdit?: (item: ShopItem) => void;
  onDelete?: (item: ShopItem) => void;
  onAssign?: (item: ShopItem) => void;
}

export function ShopItemCard({
  item,
  defaultName,
  defaultDescription,
  onView,
  onEdit,
  onDelete,
  onAssign,
}: Props) {
  const { t } = useTranslation();
  const title = defaultName?.trim() || item.code || `Item #${item.id}`;
  const localeCount = item.shop_item_locales?.length ?? 0;

  return (
    <Card className="group flex h-full flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400 text-white shadow-md">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="truncate text-base font-semibold leading-tight">{title}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {item.code} · ID #{item.id}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={item.is_custom ? "secondary" : "outline"}>
            {item.is_custom ? t("shopItem.custom") : t("shopItem.platform")}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {localeCount} {localeCount === 1 ? t("shopItem.locale") : t("shopItem.locales")}
          </span>
        </div>
      </div>

      {defaultDescription ? (
        <p className="line-clamp-3 text-sm text-muted-foreground">{defaultDescription}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground/70">{t("shopItem.noDescription")}</p>
      )}

      {(onAssign || onView || onEdit || onDelete) && (
        <div className="mt-auto flex items-center justify-end gap-1 border-t border-border/60 pt-3">
          {onAssign && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onAssign(item)}
              aria-label={t("shopItem.assignCategories", "Assign to Categories")}
              title={t("shopItem.assignCategories", "Assign to Categories")}
            >
              <FolderTree className="h-4 w-4" />
            </Button>
          )}
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
