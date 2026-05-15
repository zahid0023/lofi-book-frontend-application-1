import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FolderTree,
  ArrowLeft,
  Plus,
  ChevronRight,
  Package,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShopItemCategoryCard } from "./item-category-card";
import { useLocaleId } from "@/lib/use-locale-id";
import { itemCategoriesApi, type ShopItemCategory } from "@/services/item-categories";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: ShopItemCategory | null;
  shopId: number;
  allCategories: ShopItemCategory[];
  onView: (c: ShopItemCategory) => void;
  onEdit: (c: ShopItemCategory) => void;
  onDelete: (c: ShopItemCategory) => void;
  onAddSubCategory: (parent: ShopItemCategory) => void;
}

export function CategoryOverviewDialog({
  open,
  onOpenChange,
  category,
  shopId,
  allCategories,
  onView,
  onEdit,
  onDelete,
  onAddSubCategory,
}: Props) {
  const { t } = useTranslation();
  const localeId = useLocaleId();

  const [stack, setStack] = useState<ShopItemCategory[]>([]);
  const [drillLoading, setDrillLoading] = useState<number | null>(null);

  useEffect(() => {
    if (open && category) setStack([category]);
    if (!open) setStack([]);
  }, [open, category?.id]);

  const current = stack[stack.length - 1] ?? null;

  const localized = (c: ShopItemCategory) => {
    const list = c.locales ?? [];
    return (
      list.find((l) => l.locale_id === localeId)?.name ||
      list.find((l) => l.locale_id === 1)?.name ||
      list[0]?.name ||
      c.code
    );
  };

  const localizedDesc = (c: ShopItemCategory) => {
    const list = c.locales ?? [];
    return (
      list.find((l) => l.locale_id === localeId)?.description ||
      list[0]?.description ||
      ""
    );
  };

  const titleOf = (c: ShopItemCategory) => `${localized(c)} (${c.code})`;

  const children = useMemo(
    () =>
      current ? allCategories.filter((c) => c.parent_id === current.id) : [],
    [current, allCategories],
  );

  const shopItems = current?.shop_items ?? [];

  if (!category || !current) return null;

  const drillInto = (c: ShopItemCategory) => {
    setDrillLoading(c.id);
    itemCategoriesApi
      .get(shopId, c.id)
      .then((res) => setStack((s) => [...s, res.shop_item_category]))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setDrillLoading(null));
  };

  const goBack = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const goTo = (i: number) => setStack((s) => s.slice(0, i + 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            {titleOf(current)}
          </DialogTitle>
          <DialogDescription>
            {t("itemCategory.overviewDesc", "Browse sub-categories of this item category.")}
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {stack.length > 1 && (
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={goBack}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {t("common.back", "Back")}
            </Button>
          )}
          {stack.map((c, i) => (
            <div key={c.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              <button
                type="button"
                onClick={() => goTo(i)}
                className={
                  "rounded px-1.5 py-0.5 transition-colors hover:bg-muted " +
                  (i === stack.length - 1
                    ? "font-medium text-foreground"
                    : "hover:text-foreground")
                }
              >
                {titleOf(c)}
              </button>
            </div>
          ))}
        </div>

        {/* Sub-categories */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {t("itemCategory.subcategories")}
              <Badge variant="secondary" className="ml-2">
                {children.length}
              </Badge>
            </h4>
            <Button size="sm" onClick={() => onAddSubCategory(current)}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t("itemCategory.addSubcategory")}
            </Button>
          </div>

          {children.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("itemCategory.noSubcategories")}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {children.map((c) => {
                const subCount = allCategories.filter((x) => x.parent_id === c.id).length;
                return (
                  <ShopItemCategoryCard
                    key={c.id}
                    category={c}
                    defaultName={localized(c)}
                    defaultDescription={localizedDesc(c)}
                    subCount={subCount}
                    overviewLoading={drillLoading === c.id}
                    onOpenOverview={drillInto}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Assigned items */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {t("itemCategory.assignedItems", "Assigned items")}
              <Badge variant="secondary" className="ml-2">
                {shopItems.length}
              </Badge>
            </h4>
          </div>

          {drillLoading !== null ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : shopItems.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("itemCategory.noAssignedItems", "No items assigned to this category.")}
            </p>
          ) : (
            <div className="space-y-2">
              {shopItems.map((item) => {
                const locale =
                  item.shop_item_locales?.find((l) => l.locale_id === localeId) ??
                  item.shop_item_locales?.[0];
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {locale?.name ?? item.code}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{item.code}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      #{item.id}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
