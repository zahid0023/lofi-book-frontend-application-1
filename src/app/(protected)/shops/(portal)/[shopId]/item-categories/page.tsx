"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Plus, FolderTree, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ShopItemCategoryDialog,
  type CategoryDialogMode,
} from "@/components/item-categories/item-category-dialog";
import { CategoryOverviewDialog } from "@/components/item-categories/item-category-overview-dialog";
import { ShopItemCategoryCard } from "@/components/item-categories/item-category-card";
import { useLocaleId } from "@/lib/use-locale-id";
import { itemCategoriesApi, type ShopItemCategory } from "@/services/item-categories";

type SearchField = "all" | "code" | "name" | "description" | "parent";

export default function PortalItemCategories() {
  const params = useParams();
  const shopId = params?.shopId as string ?? "";
  const { t } = useTranslation();
  const localeId = useLocaleId();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ShopItemCategory[]>([]);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<CategoryDialogMode>("create");
  const [active, setActive] = useState<ShopItemCategory | undefined>(undefined);
  const [presetParentId, setPresetParentId] = useState<number | undefined>(undefined);

  const [overviewTarget, setOverviewTarget] = useState<ShopItemCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopItemCategory | null>(null);

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    itemCategoriesApi
      .list(Number(shopId), { size: 50, sort_by: "sortOrder", sort_dir: "ASC" })
      .then((res) => setCategories(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [shopId]);

  const localized = (c: ShopItemCategory) => {
    const list = c.shop_item_category_locales ?? [];
    return (
      list.find((l) => l.locale_id === localeId)?.name ||
      list.find((l) => l.locale_id === 1)?.name ||
      list[0]?.name ||
      c.code
    );
  };

  const localizedDesc = (c: ShopItemCategory) => {
    const list = c.shop_item_category_locales ?? [];
    return list.find((l) => l.locale_id === localeId)?.description || list[0]?.description || "";
  };

  const byId = useMemo(() => {
    const m = new Map<number, ShopItemCategory>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const visibleCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);

  const searchFieldLabels: Record<SearchField, string> = {
    all: t("itemCategory.search.all"),
    code: t("itemCategory.search.code"),
    name: t("itemCategory.search.name"),
    description: t("itemCategory.search.description"),
    parent: t("itemCategory.search.parent"),
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleCategories;
    return visibleCategories.filter((c) => {
      const code = c.code.toLowerCase();
      const name = localized(c).toLowerCase();
      const description = localizedDesc(c).toLowerCase();
      const parentCode = c.parent_id ? (byId.get(c.parent_id)?.code ?? "").toLowerCase() : "";
      switch (searchField) {
        case "code":
          return code.includes(q);
        case "name":
          return name.includes(q);
        case "description":
          return description.includes(q);
        case "parent":
          return parentCode.includes(q);
        default:
          return code.includes(q) || name.includes(q) || description.includes(q) || parentCode.includes(q);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCategories, search, searchField, byId, localeId]);

  const openCreate = (parentId?: number) => {
    setActive(undefined);
    setPresetParentId(parentId);
    setMode("create");
    setOverviewTarget(null);
    setDialogOpen(true);
  };

  const openFor = (c: ShopItemCategory, m: CategoryDialogMode) => {
    setActive(c);
    setPresetParentId(undefined);
    setMode(m);
    setDialogOpen(true);
  };

  const handleSaved = (saved: ShopItemCategory) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    itemCategoriesApi
      .delete(Number(shopId), target.id)
      .then(() => {
        setCategories((prev) =>
          prev
            .filter((x) => x.id !== target.id)
            .map((c) => (c.parent_id === target.id ? { ...c, parent_id: null } : c)),
        );
        toast.success(t("itemCategory.deletedToast"), { description: target.code });
      })
      .catch((err: Error) => toast.error(err.message));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">{t("itemCategory.pageTitle")}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t("itemCategory.pageSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={searchField} onValueChange={(v) => setSearchField(v as SearchField)}>
            <SelectTrigger className="h-10 w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{searchFieldLabels.all}</SelectItem>
              <SelectItem value="code">{searchFieldLabels.code}</SelectItem>
              <SelectItem value="name">{searchFieldLabels.name}</SelectItem>
              <SelectItem value="description">{searchFieldLabels.description}</SelectItem>
              <SelectItem value="parent">{searchFieldLabels.parent}</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("itemCategory.searchPlaceholder", {
                field: searchFieldLabels[searchField].toLowerCase(),
              })}
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
            onClick={() => openCreate()}
            className="bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-400 font-medium text-white shadow-lg shadow-indigo-500/30 hover:brightness-110"
          >
            <Plus className="mr-2 h-4 w-4" /> {t("itemCategory.newCategory")}
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
            <CardTitle>{t("itemCategory.emptyTitle")}</CardTitle>
            <CardDescription>{t("itemCategory.emptyDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => openCreate()}>
              <Plus className="mr-2 h-4 w-4" /> {t("itemCategory.newCategory")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const subCount = categories.filter((x) => x.parent_id === c.id).length;
            return (
              <ShopItemCategoryCard
                key={c.id}
                category={c}
                defaultName={localized(c)}
                defaultDescription={localizedDesc(c)}
                subCount={subCount}
                onOpenOverview={(cat) => setOverviewTarget(cat)}
                onView={(cat) => openFor(cat, "view")}
                onEdit={(cat) => openFor(cat, "edit")}
                onDelete={(cat) => setDeleteTarget(cat)}
              />
            );
          })}
        </div>
      )}

      <ShopItemCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        onModeChange={setMode}
        shopId={Number(shopId)}
        categories={categories}
        initial={active}
        presetParentId={presetParentId}
        onSaved={handleSaved}
      />

      <CategoryOverviewDialog
        open={!!overviewTarget}
        onOpenChange={(o) => !o && setOverviewTarget(null)}
        category={overviewTarget}
        allCategories={categories}
        onView={(c) => {
          setOverviewTarget(null);
          openFor(c, "view");
        }}
        onEdit={(c) => {
          setOverviewTarget(null);
          openFor(c, "edit");
        }}
        onDelete={(c) => {
          setOverviewTarget(null);
          setDeleteTarget(c);
        }}
        onAddSubCategory={(parent) => {
          setOverviewTarget(null);
          openCreate(parent.id);
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("itemCategory.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("itemCategory.deleteDesc")}</AlertDialogDescription>
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
