"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Search, Warehouse, X } from "lucide-react";
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
  ShopInventoryDialog,
  type InventoryDialogMode,
} from "@/components/shop-inventories/shop-inventory-dialog";
import { ShopInventoryCard } from "@/components/shop-inventories/shop-inventory-card";
import { useLocaleId } from "@/lib/use-locale-id";
import { shopInventoriesApi, type ShopInventory } from "@/services/shop-inventories";

export default function PortalInventory() {
  const params = useParams();
  const shopId = (params?.shopId as string) ?? "";
  const { t } = useTranslation();
  const localeId = useLocaleId();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [inventories, setInventories] = useState<ShopInventory[]>([]);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<InventoryDialogMode>("create");
  const [active, setActive] = useState<ShopInventory | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ShopInventory | null>(null);

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    shopInventoriesApi
      .list(Number(shopId), { size: 50, sort_by: "id", sort_dir: "asc" })
      .then((res) => setInventories(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [shopId]);

  const localized = (inv: ShopInventory) => {
    const list = inv.shop_inventory_locales ?? [];
    return (
      list.find((l) => l.locale_id === localeId)?.name ||
      list.find((l) => l.locale_id === 1)?.name ||
      list[0]?.name ||
      inv.code
    );
  };

  const localizedDesc = (inv: ShopInventory) => {
    const list = inv.shop_inventory_locales ?? [];
    return (
      list.find((l) => l.locale_id === localeId)?.description ||
      list[0]?.description ||
      ""
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inventories;
    return inventories.filter(
      (inv) =>
        inv.code.toLowerCase().includes(q) ||
        localized(inv).toLowerCase().includes(q) ||
        localizedDesc(inv).toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventories, search, localeId]);

  const openCreate = () => {
    setActive(undefined);
    setMode("create");
    setDialogOpen(true);
  };

  const openFor = (inv: ShopInventory, m: InventoryDialogMode) => {
    setActive(inv);
    setMode(m);
    setDialogOpen(true);
  };

  const handleSaved = (saved: ShopInventory) => {
    setInventories((prev) => {
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
    shopInventoriesApi
      .delete(Number(shopId), target.id)
      .then(() => {
        setInventories((prev) => prev.filter((i) => i.id !== target.id));
        toast.success(t("shopInventory.deletedToast"), { description: target.code });
      })
      .catch((err: Error) => toast.error(err.message));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("shopInventory.pageTitle")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{t("shopInventory.pageSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("shopInventory.searchPlaceholder")}
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
            <Plus className="mr-2 h-4 w-4" /> {t("shopInventory.newInventory")}
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
            <CardTitle>{t("shopInventory.emptyTitle")}</CardTitle>
            <CardDescription>{t("shopInventory.emptyDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> {t("shopInventory.newInventory")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((inv) => (
            <ShopInventoryCard
              key={inv.id}
              inventory={inv}
              defaultName={localized(inv)}
              defaultDescription={localizedDesc(inv)}
              onViewItems={(i) =>
                router.push(`/shops/${shopId}/inventory/${i.id}/items`)
              }
              onView={(i) => openFor(i, "view")}
              onEdit={(i) => openFor(i, "edit")}
              onDelete={(i) => setDeleteTarget(i)}
            />
          ))}
        </div>
      )}

      <ShopInventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        onModeChange={setMode}
        shopId={Number(shopId)}
        initial={active}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("shopInventory.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("shopInventory.deleteDesc")}</AlertDialogDescription>
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
