"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Boxes, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { shopInventoriesApi, type ShopItemWithVariants } from "@/services/shop-inventories";
import { useLocaleId } from "@/lib/use-locale-id";

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function StockCell({ value, className }: { value: number | null | undefined; className?: string }) {
  return (
    <td className={`whitespace-nowrap px-3 py-2.5 text-right text-sm tabular-nums ${className ?? ""}`}>
      {fmt(value)}
    </td>
  );
}

export default function InventoryItemsPage() {
  const params = useParams();
  const shopId = (params?.shopId as string) ?? "";
  const inventoryId = (params?.inventoryId as string) ?? "";
  const { t } = useTranslation();
  const router = useRouter();
  const localeId = useLocaleId();

  const [loading, setLoading] = useState(true);
  const [inventoryCode, setInventoryCode] = useState("");
  const [shopItems, setShopItems] = useState<ShopItemWithVariants[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!shopId || !inventoryId) return;
    setLoading(true);
    shopInventoriesApi
      .get(Number(shopId), Number(inventoryId))
      .then((res) => {
        setInventoryCode(res.inventory.code);
        setShopItems(res.inventory.shop_items ?? []);
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [shopId, inventoryId]);

  const localizedItemName = (item: ShopItemWithVariants): string => {
    const list = item.shop_item_locales ?? [];
    return (
      list.find((l) => l.locale_id === localeId)?.name ||
      list.find((l) => l.locale_id === 1)?.name ||
      list[0]?.name ||
      item.code
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shopItems;
    return shopItems
      .map((item) => {
        const name = localizedItemName(item);
        const itemMatch =
          item.code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
        const matchingVariants = item.item_variants.filter(
          (v) =>
            itemMatch ||
            v.code.toLowerCase().includes(q) ||
            (v.sku ?? "").toLowerCase().includes(q) ||
            (v.barcode ?? "").toLowerCase().includes(q),
        );
        return matchingVariants.length > 0 ? { ...item, item_variants: matchingVariants } : null;
      })
      .filter(Boolean) as ShopItemWithVariants[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopItems, search, localeId]);

  const totalVariants = filtered.reduce((s, i) => s + i.item_variants.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1 text-muted-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("shopInventoryItem.backToInventory")}
          </Button>
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("shopInventoryItem.pageTitle")}
            </h1>
            {inventoryCode && (
              <Badge variant="outline" className="text-xs">
                {inventoryCode}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("shopInventoryItem.pageSubtitle")}
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("shopInventoryItem.searchPlaceholderTable")}
            className="h-10 w-72 pl-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("shopInventoryItem.emptyTitle")}</CardTitle>
            <CardDescription>
              {search
                ? t("shopInventoryItem.searchPlaceholderTable")
                : t("shopInventoryItem.noVariants")}
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                    {t("shopInventoryItem.tableVariant")}
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                    {t("shopInventoryItem.tableSku")}
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                    {t("shopInventoryItem.tableBarcode")}
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {t("shopInventoryItem.tableAvailable")}
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                    {t("shopInventoryItem.tableReserved")}
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-amber-600 dark:text-amber-400">
                    {t("shopInventoryItem.tableDamaged")}
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                    {t("shopInventoryItem.tableReorderLevel")}
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                    {t("shopInventoryItem.tableMaxStock")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((item) => {
                  const name = localizedItemName(item);
                  return (
                    <>
                      <tr
                        key={`item-${item.id}`}
                        className="border-t-2 border-border bg-muted/20"
                      >
                        <td colSpan={8} className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{name}</span>
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.code}
                            </Badge>
                            {item.is_custom && (
                              <Badge variant="secondary" className="text-xs">
                                custom
                              </Badge>
                            )}
                            <span className="ml-auto text-xs text-muted-foreground">
                              {item.item_variants.length}{" "}
                              {item.item_variants.length === 1
                                ? t("shopInventoryItem.item")
                                : t("shopInventoryItem.items")}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {item.item_variants.map((variant) => {
                        const stock = variant.shop_inventory_item;
                        return (
                          <tr
                            key={`variant-${variant.id}`}
                            className="transition-colors hover:bg-muted/30"
                          >
                            <td className="px-3 py-2.5">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-foreground">
                                  {name} {fmt(variant.quantity_value)}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {variant.code}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-sm text-muted-foreground">
                              {variant.sku ?? "—"}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-muted-foreground">
                              {variant.barcode ?? "—"}
                            </td>
                            <StockCell
                              value={stock?.available_quantity}
                              className="font-medium text-emerald-700 dark:text-emerald-400"
                            />
                            <StockCell value={stock?.reserved_quantity} />
                            <StockCell
                              value={stock?.damaged_quantity}
                              className={
                                stock && stock.damaged_quantity > 0
                                  ? "text-amber-600 dark:text-amber-400"
                                  : undefined
                              }
                            />
                            <StockCell value={stock?.reorder_level} />
                            <StockCell value={stock?.max_stock_level} />
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30">
                  <td colSpan={8} className="px-3 py-2 text-xs text-muted-foreground">
                    {filtered.length}{" "}
                    {filtered.length === 1 ? t("shopInventoryItem.item") : t("shopInventoryItem.items")}{" "}
                    &middot; {totalVariants}{" "}
                    {totalVariants === 1 ? t("shopInventoryItem.item") : t("shopInventoryItem.items")}{" "}
                    {t("shopInventoryItem.tableVariant").toLowerCase()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
