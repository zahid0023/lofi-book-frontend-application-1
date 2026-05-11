"use client";

import { FormEvent, useEffect, useState } from "react";
import { Languages, Loader2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  itemCategoriesApi,
  type ShopItemCategory,
  type ShopItemCategoryLocaleInput,
} from "@/services/item-categories";
import { localesApi, type Locale } from "@/services/locales";
import { useLocaleId } from "@/lib/use-locale-id";
import { platformItemCategoriesApi } from "@/services/platform-item-categories";
import { PlatformCategoryTreeSelect } from "./platform-item-category-tree-select";

export type CategoryDialogMode = "create" | "edit" | "view";

interface LocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CategoryDialogMode;
  onModeChange: (mode: CategoryDialogMode) => void;
  shopId: number;
  categories: ShopItemCategory[];
  initial?: ShopItemCategory;
  presetParentId?: number;
  onSaved: (saved: ShopItemCategory) => void;
}

const emptyRow = (n: number): LocaleRow => ({
  locale_id: "",
  name: "",
  description: "",
  sort_order: n + 1,
  _new: true,
});

export function ShopItemCategoryDialog({
  open,
  onOpenChange,
  mode,
  onModeChange,
  shopId,
  categories,
  initial,
  presetParentId,
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const localeId = useLocaleId();

  const [code, setCode] = useState("");
  const [platformCategoryId, setPlatformCategoryId] = useState<number | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState(1);
  const [localeRows, setLocaleRows] = useState<LocaleRow[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [localesLoading, setLocalesLoading] = useState(false);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const fieldsDisabled = isView || submitting;

  // Fetch available locales and platform categories once on open
  useEffect(() => {
    if (!open) return;
    setLocalesLoading(true);
    localesApi
      .list({ size: 50 })
      .then((res) => setAvailableLocales(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLocalesLoading(false));

  }, [open]);

  // Pre-fill form when opening edit/view
  useEffect(() => {
    if (!open) return;
    if ((isEdit || isView) && initial) {
      setCode(initial.code);
      setPlatformCategoryId(initial.platform_category_id ?? null);
      setParentId(initial.parent_id ?? null);
      setSortOrder(initial.sort_order);
      // Pre-fill locale rows from embedded locales or fetch from API
      if (initial.shop_item_category_locales?.length) {
        setLocaleRows(
          initial.shop_item_category_locales.map((l) => ({
            id: l.id,
            locale_id: l.locale_id,
            name: l.name,
            description: l.description,
            sort_order: l.sort_order,
          })),
        );
      } else {
        itemCategoriesApi.locales
          .list(shopId, initial.id, { size: 50 })
          .then((res) =>
            setLocaleRows(
              res.data.map((l) => ({
                id: l.id,
                locale_id: l.locale_id,
                name: l.name,
                description: l.description,
                sort_order: l.sort_order,
              })),
            ),
          )
          .catch(() => setLocaleRows([]));
      }
    } else {
      setCode("");
      setPlatformCategoryId(null);
      setParentId(presetParentId ?? null);
      setSortOrder(1);
      setLocaleRows([]);
    }
  }, [open, mode, initial?.id, presetParentId]);

  // Auto-fill locale rows from the selected platform category (create mode only)
  useEffect(() => {
    if (mode !== "create" || !platformCategoryId) return;
    platformItemCategoriesApi
      .get(platformCategoryId)
      .then((res) => {
        const locs = res.platform_item_category.platform_item_category_locales ?? [];
        if (locs.length > 0) {
          setLocaleRows(
            locs.map((l, idx) => ({
              locale_id: l.locale_id,
              name: l.name,
              description: l.description,
              sort_order: idx + 1,
              _new: true,
            })),
          );
        }
      })
      .catch(() => {});
  }, [platformCategoryId, mode]);

  const resolveParentLabel = (pid: number | null) => {
    if (!pid) return t("itemCategory.noParent");
    const cat = categories.find((c) => c.id === pid);
    if (!cat) return `#${pid}`;
    const loc = cat.shop_item_category_locales?.find((l) => l.locale_id === localeId);
    return loc?.name ?? cat.shop_item_category_locales?.[0]?.name ?? cat.code;
  };

  const updateRow = (i: number, patch: Partial<LocaleRow>) =>
    setLocaleRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const removeRow = (i: number) =>
    setLocaleRows((rows) => rows.filter((_, idx) => idx !== i));

  const addRow = () =>
    setLocaleRows((rows) => [...rows, emptyRow(rows.length)]);

  const usedLocaleIds = localeRows.map((r) => r.locale_id).filter((id) => id !== "");
  const canAddRow = !fieldsDisabled && localeRows.length < availableLocales.length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error(t("itemCategory.errCode"));
      return;
    }
    if (!platformCategoryId) {
      toast.error(t("itemCategory.errPlatformCategory"));
      return;
    }
    for (let i = 0; i < localeRows.length; i++) {
      const r = localeRows[i];
      if (r.locale_id === "") { toast.error(t("itemCategory.errLocaleLang", { n: i + 1 })); return; }
      if (!r.name.trim()) { toast.error(t("itemCategory.errLocaleName", { n: i + 1 })); return; }
      if (!r.description.trim()) { toast.error(t("itemCategory.errLocaleDesc", { n: i + 1 })); return; }
    }

    setSubmitting(true);
    try {
      if (isEdit && initial) {
        await itemCategoriesApi.update(shopId, initial.id, {
          code: code.trim(),
          platform_category_id: platformCategoryId!,
          parent_id: parentId,
          sort_order: sortOrder,
        });
        for (const row of localeRows) {
          const payload: ShopItemCategoryLocaleInput = {
            locale_id: row.locale_id as number,
            name: row.name.trim(),
            description: row.description.trim(),
            sort_order: row.sort_order,
          };
          if (row._new || !row.id) {
            await itemCategoriesApi.locales.add(shopId, initial.id, payload);
          } else {
            await itemCategoriesApi.locales.update(shopId, initial.id, row.id, payload);
          }
        }
        const updated: ShopItemCategory = {
          ...initial,
          code: code.trim(),
          platform_category_id: platformCategoryId!,
          parent_id: parentId,
          sort_order: sortOrder,
          shop_item_category_locales: localeRows.map((r, idx) => ({
            id: r.id ?? 0,
            locale_id: r.locale_id as number,
            name: r.name.trim(),
            description: r.description.trim(),
            sort_order: r.sort_order ?? idx + 1,
          })),
        };
        toast.success(t("itemCategory.updatedToast"));
        onSaved(updated);
        onOpenChange(false);
      } else {
        const res = await itemCategoriesApi.create(shopId, {
          code: code.trim(),
          platform_category_id: platformCategoryId!,
          parent_id: parentId,
          sort_order: sortOrder,
          locales: localeRows.map((r, idx) => ({
            locale_id: r.locale_id as number,
            name: r.name.trim(),
            description: r.description.trim(),
            sort_order: r.sort_order ?? idx + 1,
          })),
        });
        const created: ShopItemCategory = {
          id: res.id,
          code: code.trim(),
          platform_category_id: platformCategoryId!,
          parent_id: parentId,
          sort_order: sortOrder,
          shop_item_category_locales: localeRows.map((r, idx) => ({
            id: 0,
            locale_id: r.locale_id as number,
            name: r.name.trim(),
            description: r.description.trim(),
            sort_order: r.sort_order ?? idx + 1,
          })),
        };
        toast.success(t("itemCategory.createdToast"));
        onSaved(created);
        onOpenChange(false);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const titleKey = mode === "create" ? "itemCategory.titleCreate"
    : mode === "edit" ? "itemCategory.titleEdit"
    : "itemCategory.titleView";
  const descKey = mode === "create" ? "itemCategory.dialogDesc"
    : mode === "edit" ? "itemCategory.dialogDescEdit"
    : "itemCategory.dialogDescView";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t(descKey)}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code */}
          <div className="space-y-1.5">
            <Label>{t("itemCategory.code")}</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={fieldsDisabled || isEdit}
              placeholder="E.g. BEVERAGES"
              maxLength={50}
            />
          </div>

          {/* Platform category */}
          <div className="space-y-1.5">
            <Label>{t("itemCategory.platformCategory")}</Label>
            <PlatformCategoryTreeSelect
              value={platformCategoryId}
              onChange={setPlatformCategoryId}
              disabled={fieldsDisabled}
            />
          </div>

          {/* Parent category */}
          <div className="space-y-1.5">
            <Label>{t("itemCategory.parent")}</Label>
            <Select
              value={parentId !== null ? String(parentId) : "__none__"}
              onValueChange={(v) => setParentId(v === "__none__" ? null : Number(v))}
              disabled={fieldsDisabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("itemCategory.noParent")}>
                  {resolveParentLabel(parentId)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("itemCategory.noParent")}</SelectItem>
                {categories
                  .filter((c) => c.id !== initial?.id)
                  .map((c) => {
                    const loc = c.shop_item_category_locales?.find((l) => l.locale_id === localeId);
                    const label = loc?.name ?? c.shop_item_category_locales?.[0]?.name ?? c.code;
                    return (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {label} <span className="text-muted-foreground">({c.code})</span>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {/* Sort order */}
          <div className="space-y-1.5">
            <Label>{t("createShop.sortOrder")}</Label>
            <Input
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              disabled={fieldsDisabled}
              className="w-28"
            />
          </div>

          {/* Locale rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t("itemCategory.localeTranslations")}</span>
                {localeRows.length > 0 && (
                  <Badge variant="secondary">{localeRows.length}</Badge>
                )}
              </div>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addRow}
                  disabled={!canAddRow || localesLoading}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t("itemCategory.addLocale")}
                </Button>
              )}
            </div>

            {localeRows.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                {isView ? t("itemCategory.noLocalesView") : t("itemCategory.noLocalesCreate")}
              </p>
            ) : (
              <div className="space-y-3">
                {localeRows.map((row, i) => {
                  const isExisting = !row._new;
                  return (
                    <div key={i} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {t("itemCategory.localeRow")} {i + 1}
                          </span>
                          {row._new && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {t("itemCategory.newBadge")}
                            </Badge>
                          )}
                        </div>
                        {!isView && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeRow(i)}
                            disabled={submitting}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("itemCategory.language")}</Label>
                          <Select
                            value={row.locale_id !== "" ? String(row.locale_id) : ""}
                            onValueChange={(v) => updateRow(i, { locale_id: Number(v) })}
                            disabled={fieldsDisabled || (isExisting && !row._new)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={t("itemCategory.selectLanguage")} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableLocales.map((l) => (
                                <SelectItem
                                  key={l.id}
                                  value={String(l.id)}
                                  disabled={usedLocaleIds.includes(l.id) && row.locale_id !== l.id}
                                >
                                  {l.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("itemCategory.name")}</Label>
                          <Input
                            value={row.name}
                            onChange={(e) => updateRow(i, { name: e.target.value })}
                            disabled={fieldsDisabled}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">{t("itemCategory.description")}</Label>
                        <Textarea
                          value={row.description}
                          onChange={(e) => updateRow(i, { description: e.target.value })}
                          disabled={fieldsDisabled}
                          rows={2}
                          className="text-xs resize-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {isView ? (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.close")}
                </Button>
                <Button type="button" onClick={() => onModeChange("edit")}>
                  <Pencil className="mr-2 h-4 w-4" /> {t("common.edit")}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-400 text-white",
                    "hover:brightness-110",
                  )}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? t("common.save") : t("itemCategory.create")}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
