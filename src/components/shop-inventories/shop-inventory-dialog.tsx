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
  shopInventoriesApi,
  type ShopInventory,
  type ShopInventoryLocaleInput,
} from "@/services/shop-inventories";
import { localesApi, type Locale } from "@/services/locales";

export type InventoryDialogMode = "create" | "edit" | "view";

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
  mode: InventoryDialogMode;
  onModeChange: (mode: InventoryDialogMode) => void;
  shopId: number;
  initial?: ShopInventory;
  onSaved: (saved: ShopInventory) => void;
}

const emptyRow = (n: number): LocaleRow => ({
  locale_id: "",
  name: "",
  description: "",
  sort_order: n + 1,
  _new: true,
});

export function ShopInventoryDialog({
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
  const [localeRows, setLocaleRows] = useState<LocaleRow[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [localesLoading, setLocalesLoading] = useState(false);

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
      if (initial.shop_inventory_locales?.length) {
        setLocaleRows(
          initial.shop_inventory_locales.map((l) => ({
            id: l.id,
            locale_id: l.locale_id,
            name: l.name,
            description: l.description,
            sort_order: l.sort_order,
          })),
        );
      } else {
        shopInventoriesApi.locales
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
      setLocaleRows([]);
    }
  }, [open, mode, initial?.id]);

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
      toast.error(t("shopInventory.errCode"));
      return;
    }
    for (let i = 0; i < localeRows.length; i++) {
      const r = localeRows[i];
      if (r.locale_id === "") { toast.error(t("shopInventory.errLocaleLang", { n: i + 1 })); return; }
      if (!r.name.trim()) { toast.error(t("shopInventory.errLocaleName", { n: i + 1 })); return; }
      if (!r.description.trim()) { toast.error(t("shopInventory.errLocaleDesc", { n: i + 1 })); return; }
    }

    setSubmitting(true);
    try {
      if (isEdit && initial) {
        await shopInventoriesApi.update(shopId, initial.id, { code: code.trim() });
        for (const row of localeRows) {
          const payload: ShopInventoryLocaleInput = {
            locale_id: row.locale_id as number,
            name: row.name.trim(),
            description: row.description.trim(),
            sort_order: row.sort_order,
          };
          if (row._new || !row.id) {
            await shopInventoriesApi.locales.add(shopId, initial.id, payload);
          } else {
            await shopInventoriesApi.locales.update(shopId, initial.id, row.id, payload);
          }
        }
        const updated: ShopInventory = {
          ...initial,
          code: code.trim(),
          shop_inventory_locales: localeRows.map((r, idx) => ({
            id: r.id ?? 0,
            shop_inventory_id: initial.id,
            locale_id: r.locale_id as number,
            name: r.name.trim(),
            description: r.description.trim(),
            sort_order: r.sort_order ?? idx + 1,
          })),
        };
        toast.success(t("shopInventory.updatedToast"));
        onSaved(updated);
        onOpenChange(false);
      } else {
        const res = await shopInventoriesApi.create(shopId, {
          code: code.trim(),
          locales: localeRows.map((r, idx) => ({
            locale_id: r.locale_id as number,
            name: r.name.trim(),
            description: r.description.trim(),
            sort_order: r.sort_order ?? idx + 1,
          })),
        });
        const created: ShopInventory = {
          id: res.id,
          shop_id: shopId,
          code: code.trim(),
          shop_inventory_locales: localeRows.map((r, idx) => ({
            id: 0,
            shop_inventory_id: res.id,
            locale_id: r.locale_id as number,
            name: r.name.trim(),
            description: r.description.trim(),
            sort_order: r.sort_order ?? idx + 1,
          })),
        };
        toast.success(t("shopInventory.createdToast"));
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
    mode === "create" ? "shopInventory.titleCreate"
    : mode === "edit" ? "shopInventory.titleEdit"
    : "shopInventory.titleView";
  const descKey =
    mode === "create" ? "shopInventory.dialogDesc"
    : mode === "edit" ? "shopInventory.dialogDescEdit"
    : "shopInventory.dialogDescView";

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
            <Label>{t("shopInventory.code")}</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={fieldsDisabled || isEdit}
              placeholder="E.g. MAIN_WAREHOUSE"
              maxLength={100}
            />
          </div>

          {/* Locale rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t("shopInventory.localeTranslations")}</span>
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
                  {t("shopInventory.addLocale")}
                </Button>
              )}
            </div>

            {localeRows.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                {t("shopInventory.noLocales")}
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
                            {t("shopInventory.localeRow")} {i + 1}
                          </span>
                          {row._new && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {t("shopInventory.newBadge")}
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
                          <Label className="text-xs">{t("shopInventory.language")}</Label>
                          <Select
                            value={row.locale_id !== "" ? String(row.locale_id) : ""}
                            onValueChange={(v) => updateRow(i, { locale_id: Number(v) })}
                            disabled={fieldsDisabled || (isExisting && !row._new)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={t("shopInventory.selectLanguage")} />
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
                          <Label className="text-xs">{t("shopInventory.name")}</Label>
                          <Input
                            value={row.name}
                            onChange={(e) => updateRow(i, { name: e.target.value })}
                            disabled={fieldsDisabled}
                            className="h-8 text-xs"
                            maxLength={150}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">{t("shopInventory.description")}</Label>
                        <Textarea
                          value={row.description}
                          onChange={(e) => updateRow(i, { description: e.target.value })}
                          disabled={fieldsDisabled}
                          rows={2}
                          className="text-xs resize-none"
                        />
                      </div>

                      <div className="space-y-1 w-28">
                        <Label className="text-xs">{t("shopInventory.sortOrder")}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={row.sort_order}
                          onChange={(e) => updateRow(i, { sort_order: Number(e.target.value) })}
                          disabled={fieldsDisabled}
                          className="h-8 text-xs"
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
                  {isEdit ? t("common.save") : t("shopInventory.create")}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
