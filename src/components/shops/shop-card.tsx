import { Pencil, Trash2, Eye, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  resolveShopDescription,
  resolveShopName,
  resolveShopTypeName,
} from "@/lib/shop-type-name";
import { useLocaleId } from "@/lib/use-locale-id";
import type { ShopCardProps } from "./types";

export function ShopCard({
  shop,
  defaultName,
  defaultDescription,
  onOpen,
  onView,
  onEdit,
  onDelete,
}: ShopCardProps) {
  const localeId = useLocaleId();
  const localizedName = resolveShopName(shop.code, shop.shop_locales, localeId);
  const localizedDescription = resolveShopDescription(shop.shop_locales, localeId);
  const title = (defaultName?.trim() && defaultName) || localizedName || `Shop #${shop.id}`;
  const description = (defaultDescription?.trim() && defaultDescription) || localizedDescription;
  const subtitle = `${shop.code} · ID #${shop.id}`;
  const monogram = (shop.code || "SH").slice(0, 3).toUpperCase();
  const shopTypeName = resolveShopTypeName(shop.shop_type, localeId);

  const clickable = !!onOpen;
  const handleOpen = () => onOpen?.(shop);
  const handleKey = (e: React.KeyboardEvent) => {
    if (!onOpen) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(shop);
    }
  };

  return (
    <Card
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleOpen : undefined}
      onKeyDown={clickable ? handleKey : undefined}
      className={
        "group flex h-full flex-col gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg" +
        (clickable ? " cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" : "")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400 text-xs font-bold tracking-wide text-white shadow-md">
            {monogram}
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="truncate text-base font-semibold leading-tight">
              {title}
            </h3>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">
          #{shop.sort_order}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="gap-1 font-medium">
          <Tag className="h-3 w-3" />
          {shopTypeName}
        </Badge>
      </div>

      {description ? (
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {description}
        </p>
      ) : (
        <p className="text-sm italic text-muted-foreground/70">No description.</p>
      )}

      {(onView || onEdit || onDelete) && (
        <div
          className="mt-auto flex items-center justify-end gap-1 border-t border-border/60 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {onView && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onView(shop)}
              aria-label="View shop"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onEdit(shop)}
              aria-label="Edit shop"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDelete(shop)}
              aria-label="Delete shop"
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