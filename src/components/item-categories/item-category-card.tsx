import { Pencil, Trash2, Eye, FolderTree, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ShopItemCategory } from "@/services/item-categories";

export interface ShopItemCategoryCardProps {
  category: ShopItemCategory;
  defaultName?: string;
  defaultDescription?: string;
  parentLabel?: string;
  subCount?: number;
  onView?: (cat: ShopItemCategory) => void;
  onEdit?: (cat: ShopItemCategory) => void;
  onDelete?: (cat: ShopItemCategory) => void;
  onManageItems?: (cat: ShopItemCategory) => void;
  onOpenOverview?: (cat: ShopItemCategory) => void;
}

export function ShopItemCategoryCard({
  category,
  defaultName,
  defaultDescription,
  parentLabel,
  subCount,
  onView,
  onEdit,
  onDelete,
  onManageItems,
  onOpenOverview,
}: ShopItemCategoryCardProps) {
  const { t } = useTranslation();
  const title =
    defaultName?.trim() || category.code || `Category #${category.id}`;
  const subtitle = `${category.code} · ID #${category.id}`;
  const localeCount = category.shop_item_category_locales?.length ?? 0;
  const clickable = !!onOpenOverview;

  return (
    <Card
      onClick={() => onOpenOverview?.(category)}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenOverview?.(category);
        }
      }}
      className={
        "group flex h-full flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg" +
        (clickable
          ? " cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          : "")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400 text-white shadow-md">
            <FolderTree className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="truncate text-base font-semibold leading-tight">
              {title}
            </h3>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {localeCount}{" "}
          {localeCount === 1 ? t("itemCategory.locale") : t("itemCategory.locales")}
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground">
        <span className="font-medium">{t("itemCategory.parent")}:</span>{" "}
        {parentLabel ??
          (category.parent_id
            ? `#${category.parent_id}`
            : t("itemCategory.topLevel"))}
        {typeof subCount === "number" && (
          <span className="ml-2">
            · {subCount} {t("itemCategory.subs")}
          </span>
        )}
      </div>

      {defaultDescription ? (
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {defaultDescription}
        </p>
      ) : (
        <p className="text-sm italic text-muted-foreground/70">
          {t("itemCategory.noDescription")}
        </p>
      )}

      {(onView || onEdit || onDelete || onManageItems || onOpenOverview) && (
        <div
          className="mt-auto flex items-center justify-end gap-1 border-t border-border/60 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {onManageItems && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onManageItems(category)}
              aria-label="Manage items"
            >
              <Package className="h-4 w-4" />
            </Button>
          )}
          {onView && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onView(category)}
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
              onClick={() => onEdit(category)}
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
              onClick={() => onDelete(category)}
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
