"use client";

import { FormEvent, useEffect, useState } from "react";
import { Languages, Loader2, Package, Pencil, Plus, X } from "lucide-react";
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
  shopItemsApi,
  type ShopItem,
  type ShopItemLocaleInput,
  type ShopItemVariantInput,
} from "@/services/shop-items";
import { localesApi, type Locale } from "@/services/locales";
import { platformItemsApi } from "@/services/platform-items";
import { PlatformItemSelect } from "./platform-item-select";

export type ItemDialogMode = "create" | "edit" | "view";

interface LocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

interface VariantRow {
  code: string;
  sort_order: number;
  sku: string;
  barcode: string;
  quantity_value: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ItemDialogMode;
  onModeChange: (mode: ItemDialogMode) => void;
  shopId: number;
  initial?: ShopItem;
  onSaved: (saved: ShopItem) => void;
}

const emptyRow = (n: number): LocaleRow => ({
  locale_id: "",
  name: "",
  description: "",
  sort_order: n + 1,
  _new: true,
});

const emptyVariantRow = (n: number): VariantRow => ({
  code: "",
  sort_order: n + 1,
  sku: "",
  barcode: "",
  quantity_value: "",
});

export function ShopItemDialog({
  open,
  onOpenChange,
  mode,
  onModeChange,
  shopId,
  initial,
  onSaved,
}: Props) {
  const { t } = useTranslation();

  const [code, setCode] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [platformItemId, setPlatformItemId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState(1);
  const [localeRows, setLocaleRows] = useState<LocaleRow[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [localesLoading, setLocalesLoading] = useState(false);
  const [variantsLoading, setVariantsLoading] = useState(false);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const fieldsDisabled = isView || submitting;

  useEffect(() => {
    if (!open) return;
    setLocalesLoading(true);
    localesApi
      .list({ size: 50 })
      .then((res) => setAvailableLocales(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLocalesLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if ((isEdit || isView) && initial) {
      setCode(initial.code);
      setIsCustom(initial.is_custom);
      setPlatformItemId(initial.platform_item_id ?? null);
      setSortOrder(initial.sort_order);
      if (initial.shop_item_locales?.length) {
        setLocaleRows(
          initial.shop_item_locales.map((l) => ({
            id: l.id,
            locale_id: l.locale_id,
            name: l.name,
            description: l.description,
            sort_order: l.sort_order,
          })),
        );
      } else {
        shopItemsApi.locales
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
      setIsCustom(false);
      setPlatformItemId(null);
      setSortOrder(1);
      setLocaleRows([]);
      setVariantRows([]);
    }
  }, [open, mode, initial?.id]);

  // Auto-fill locale + variant rows from the selected platform item (create mode only)
  useEffect(() => {
    if (mode !== "create" || !platformItemId) return;

    platformItemsApi
      .get(platformItemId)
      .then((res) => {
        const locs = res.platform_item.platform_item_locales ?? [];
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

    setVariantsLoading(true);
    platformItemsApi.variants
      .list(platformItemId, { size: 50 })
      .then((res) => {
        setVariantRows(
          res.data.map((v) => ({
            code: v.code,
            sort_order: v.sort_order,
            sku: "",
            barcode: "",
            quantity_value: String(v.quantity_value),
          })),
        );
      })
      .catch(() => {})
      .finally(() => setVariantsLoading(false));
  }, [platformItemId, mode]);

  const updateRow = (i: number, patch: Partial<LocaleRow>) =>
    setLocaleRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const removeRow = (i: number) =>
    setLocaleRows((rows) => rows.filter((_, idx) => idx !== i));

  const addRow = () =>
    setLocaleRows((rows) => [...rows, emptyRow(rows.length)]);

  const updateVariantRow = (i: number, patch: Partial<VariantRow>) =>
    setVariantRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const removeVariantRow = (i: number) =>
    setVariantRows((rows) => rows.filter((_, idx) => idx !== i));

  const addVariantRow = () =>
    setVariantRows((rows) => [...rows, emptyVariantRow(rows.length)]);

  const usedLocaleIds = localeRows.map((r) => r.locale_id).filter((id) => id !== "");
  const canAddRow = !fieldsDisabled && localeRows.length < availableLocales.length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error(t("shopItem.errCode"));
      return;
    }
    if (!isCustom && !platformItemId) {
      toast.error(t("shopItem.errPlatformItem"));
      return;
    }
    for (let i = 0; i < localeRows.length; i++) {
      const r = localeRows[i];
      if (r.locale_id === "") { toast.error(t("shopItem.errLocaleLang", { n: i + 1 })); return; }
      if (!r.name.trim()) { toast.error(t("shopItem.errLocaleName", { n: i + 1 })); return; }
      if (!r.description.trim()) { toast.error(t("shopItem.errLocaleDesc", { n: i + 1 })); return; }
    }
    for (let i = 0; i < variantRows.length; i++) {
      const v = variantRows[i];
      if (!v.code.trim()) { toast.error(t("shopItem.errVariantCode", { n: i + 1 })); return; }
      if (v.quantity_value === "" || isNaN(Number(v.quantity_value))) {
        toast.error(t("shopItem.errVariantQty", { n: i + 1 })); return;
      }
    }

    setSubmitting(true);
    try {
      const pid = isCustom ? null : platformItemId;

      if (isEdit && initial) {
        await shopItemsApi.update(shopId, initial.id, {
          code: code.trim(),
          platform_item_id: pid,
          is_custom: isCustom,
          sort_order: sortOrder,
        });
        for (const row of localeRows) {
          const payload: ShopItemLocaleInput = {
            locale_id: row.locale_id as number,
            name: row.name.trim(),
            description: row.description.trim(),
            sort_order: row.sort_order,
          };
          if (row._new || !row.id) {
            await shopItemsApi.locales.add(shopId, initial.id, payload);
          } else {
            await shopItemsApi.locales.update(shopId, initial.id, row.id, payload);
          }
        }
        const updated: ShopItem = {
          ...initial,
          code: code.trim(),
          platform_item_id: pid,
          is_custom: isCustom,
          sort_order: sortOrder,
          shop_item_locales: localeRows.map((r, idx) => ({
            id: r.id ?? 0,
            locale_id: r.locale_id as number,
            name: r.name.trim(),
            description: r.description.trim(),
            sort_order: r.sort_order ?? idx + 1,
          })),
        };
        toast.success(t("shopItem.updatedToast"));
        onSaved(updated);
        onOpenChange(false);
      } else {
        const variantPayload: ShopItemVariantInput[] = variantRows.map((v, idx) => ({
          code: v.code.trim(),
          sort_order: v.sort_order ?? idx + 1,
          quantity_value: Number(v.quantity_value),
          ...(v.sku.trim() ? { sku: v.sku.trim() } : {}),
          ...(v.barcode.trim() ? { barcode: v.barcode.trim() } : {}),
        }));
        const res = await shopItemsApi.create(shopId, {
          code: code.trim(),
          platform_item_id: pid,
          is_custom: isCustom,
          sort_order: sortOrder,
          locales: localeRows.map((r, idx) => ({
            locale_id: r.locale_id as number,
            name: r.name.trim(),
            description: r.description.trim(),
            sort_order: r.sort_order ?? idx + 1,
          })),
          variants: variantPayload.length > 0 ? variantPayload : undefined,
        });
        const created: ShopItem = {
          id: res.id,
          code: code.trim(),
          platform_item_id: pid,
          is_custom: isCustom,
          sort_order: sortOrder,
          shop_item_locales: localeRows.map((r, idx) => ({
            id: 0,
            locale_id: r.locale_id as number,
            name: r.name.trim(),
            description: r.description.trim(),
            sort_order: r.sort_order ?? idx + 1,
          })),
        };
        toast.success(t("shopItem.createdToast"));
        onSaved(created);
        onOpenChange(false);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const titleKey =
    mode === "create" ? "shopItem.titleCreate"
    : mode === "edit" ? "shopItem.titleEdit"
    : "shopItem.titleView";
  const descKey =
    mode === "create" ? "shopItem.dialogDesc"
    : mode === "edit" ? "shopItem.dialogDescEdit"
    : "shopItem.dialogDescView";

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
            <Label>{t("shopItem.code")}</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={fieldsDisabled || isEdit}
              placeholder="E.g. LATTE_LARGE"
              maxLength={50}
            />
          </div>

          {/* Is custom toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>{t("shopItem.isCustom")}</Label>
              <p className="text-xs text-muted-foreground">{t("shopItem.isCustomHint")}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isCustom}
              disabled={fieldsDisabled}
              onClick={() => setIsCustom((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                isCustom ? "bg-primary" : "bg-input",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                  isCustom ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {/* Platform item — only when not custom */}
          {!isCustom && (
            <div className="space-y-1.5">
              <Label>{t("shopItem.platformItem")}</Label>
              <PlatformItemSelect
                value={platformItemId}
                onChange={setPlatformItemId}
                disabled={fieldsDisabled}
              />
              <p className="text-xs text-muted-foreground">{t("shopItem.platformItemHint")}</p>
            </div>
          )}

          {/* Sort order */}
          <div className="space-y-1.5">
            <Label>{t("shopItem.sortOrder")}</Label>
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
                <span className="text-sm font-medium">{t("shopItem.localeTranslations")}</span>
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
                  {t("shopItem.addLocale")}
                </Button>
              )}
            </div>

            {localeRows.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                {t("shopItem.noLocales")}
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
                            {t("shopItem.localeRow")} {i + 1}
                          </span>
                          {row._new && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {t("shopItem.newBadge")}
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
                          <Label className="text-xs">{t("shopItem.language")}</Label>
                          <Select
                            value={row.locale_id !== "" ? String(row.locale_id) : ""}
                            onValueChange={(v) => updateRow(i, { locale_id: Number(v) })}
                            disabled={fieldsDisabled || (isExisting && !row._new)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={t("shopItem.selectLanguage")} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableLocales.map((l) => (
                                <SelectItem
                                  key={l.id}
                                  value={String(l.id)}
                                  disabled={
                                    usedLocaleIds.includes(l.id) && row.locale_id !== l.id
                                  }
                                >
                                  {l.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("shopItem.name")}</Label>
                          <Input
                            value={row.name}
                            onChange={(e) => updateRow(i, { name: e.target.value })}
                            disabled={fieldsDisabled}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">{t("shopItem.description")}</Label>
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

          {/* Variant rows — create mode only */}
          {mode === "create" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("shopItem.variantSection")}</span>
                  {variantRows.length > 0 && (
                    <Badge variant="secondary">{variantRows.length}</Badge>
                  )}
                  {variantsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addVariantRow}
                  disabled={fieldsDisabled}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t("shopItem.addVariant")}
                </Button>
              </div>

              {variantRows.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  {t("shopItem.noVariants")}
                </p>
              ) : (
                <div className="space-y-3">
                  {variantRows.map((row, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t("shopItem.variantRow")} {i + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeVariantRow(i)}
                          disabled={submitting}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("shopItem.variantCode")} *</Label>
                          <Input
                            value={row.code}
                            onChange={(e) => updateVariantRow(i, { code: e.target.value.toUpperCase() })}
                            disabled={fieldsDisabled}
                            className="h-8 text-xs"
                            maxLength={100}
                            placeholder="E.g. COFFEE-250G"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("shopItem.variantQty")} *</Label>
                          <Input
                            value={row.quantity_value}
                            onChange={(e) => updateVariantRow(i, { quantity_value: e.target.value })}
                            disabled={fieldsDisabled}
                            className="h-8 text-xs"
                            placeholder="E.g. 250.000"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("shopItem.variantSortOrder")}</Label>
                          <Input
                            type="number"
                            min={1}
                            value={row.sort_order}
                            onChange={(e) => updateVariantRow(i, { sort_order: Number(e.target.value) })}
                            disabled={fieldsDisabled}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("shopItem.variantSku")}</Label>
                          <Input
                            value={row.sku}
                            onChange={(e) => updateVariantRow(i, { sku: e.target.value })}
                            disabled={fieldsDisabled}
                            className="h-8 text-xs"
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("shopItem.variantBarcode")}</Label>
                          <Input
                            value={row.barcode}
                            onChange={(e) => updateVariantRow(i, { barcode: e.target.value })}
                            disabled={fieldsDisabled}
                            className="h-8 text-xs"
                            maxLength={100}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
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
                  {isEdit ? t("common.save") : t("shopItem.create")}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
