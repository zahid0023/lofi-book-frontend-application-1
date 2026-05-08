"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Loader2, Package, Plus, Search, X } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ShopItemDialog,
  type ItemDialogMode,
} from "@/components/shop-items/shop-item-dialog";
import { ShopItemCard } from "@/components/shop-items/shop-item-card";
import { AssignCategoriesDialog } from "@/components/shop-items/assign-categories-dialog";
import { useLocaleId } from "@/lib/use-locale-id";
import { shopItemsApi, type ShopItem } from "@/services/shop-items";

export default function PortalItems() {
  const params = useParams();
  const shopId = (params?.shopId as string) ?? "";
  const { t } = useTranslation();
  const localeId = useLocaleId();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<ItemDialogMode>("create");
  const [active, setActive] = useState<ShopItem | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ShopItem | null>(null);
  const [assignTarget, setAssignTarget] = useState<ShopItem | null>(null);

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    shopItemsApi
      .list(Number(shopId), { size: 50, sort_by: "sortOrder", sort_dir: "ASC" })
      .then((res) => setItems(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [shopId]);

  const localized = (item: ShopItem) => {
    const list = item.shop_item_locales ?? [];
    return (
      list.find((l) => l.locale_id === localeId)?.name ||
      list.find((l) => l.locale_id === 1)?.name ||
      list[0]?.name ||
      item.code
    );
  };

  const localizedDesc = (item: ShopItem) => {
    const list = item.shop_item_locales ?? [];
    return (
      list.find((l) => l.locale_id === localeId)?.description ||
      list[0]?.description ||
      ""
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        localized(item).toLowerCase().includes(q) ||
        localizedDesc(item).toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, localeId]);

  const openCreate = () => {
    setActive(undefined);
    setMode("create");
    setDialogOpen(true);
  };

  const openFor = (item: ShopItem, m: ItemDialogMode) => {
    setActive(item);
    setMode(m);
    setDialogOpen(true);
  };

  const handleSaved = (saved: ShopItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === saved.id);
      return exists
        ? prev.map((i) => (i.id === saved.id ? saved : i))
        : [saved, ...prev];
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    shopItemsApi
      .delete(Number(shopId), target.id)
      .then(() => {
        setItems((prev) => prev.filter((i) => i.id !== target.id));
        toast.success(t("shopItem.deletedToast"), { description: target.code });
      })
      .catch((err: Error) => toast.error(err.message));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("shopItem.pageTitle")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{t("shopItem.pageSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("shopItem.searchPlaceholder")}
              className="h-10 w-64 pl-9"
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
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-400 font-medium text-white shadow-lg shadow-indigo-500/30 hover:brightness-110"
          >
            <Plus className="mr-2 h-4 w-4" /> {t("shopItem.newItem")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("shopItem.emptyTitle")}</CardTitle>
            <CardDescription>{t("shopItem.emptyDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> {t("shopItem.newItem")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              defaultName={localized(item)}
              defaultDescription={localizedDesc(item)}
              onAssign={(i) => setAssignTarget(i)}
              onView={(i) => openFor(i, "view")}
              onEdit={(i) => openFor(i, "edit")}
              onDelete={(i) => setDeleteTarget(i)}
            />
          ))}
        </div>
      )}

      <ShopItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        onModeChange={setMode}
        shopId={Number(shopId)}
        initial={active}
        onSaved={handleSaved}
      />

      <AssignCategoriesDialog
        open={!!assignTarget}
        onOpenChange={(o) => !o && setAssignTarget(null)}
        shopId={Number(shopId)}
        item={assignTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("shopItem.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("shopItem.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
