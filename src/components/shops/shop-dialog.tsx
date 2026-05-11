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
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shopsApi, type Shop } from "@/services/shops";
import { localesApi, type Locale } from "@/services/locales";
import { shopTypesApi, type ShopType } from "@/services/shop-types";
import { resolveShopTypeName } from "@/lib/shop-type-name";
import { useLocaleId } from "@/lib/use-locale-id";

import {
  type ShopDialogProps,
  type ShopLocaleRow,
  type ShopFormState,
} from "./types";

export function ShopDialog({
  open,
  onOpenChange,
  mode,
  onModeChange,
  shopId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: ShopDialogProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const localeId = useLocaleId();
  const [shopTypes, setShopTypes] = useState<ShopType[]>([]);
  const [shopTypesLoading, setShopTypesLoading] = useState(false);
  const [locales, setLocales] = useState<Locale[]>(availableLocales ?? []);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShopTypesLoading(true);
    shopTypesApi
      .list({ size: 50, sort_by: "sortOrder", sort_dir: "ASC" })
      .then((res) => setShopTypes(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setShopTypesLoading(false));

    if (!availableLocales?.length) {
      localesApi
        .list({ size: 50, sort_by: "sortOrder", sort_dir: "ASC" })
        .then((res) => setLocales(res.data))
        .catch(() => {});
    }

    if ((mode === "edit" || mode === "view") && shopId != null) {
      shopsApi.locales
        .list(shopId, { size: 50, sort_by: "sortOrder", sort_dir: "ASC" })
        .then((res) => {
          onFormChange({
            ...form,
            locales: res.data.map((l) => ({
              id: l.id,
              locale_id: l.locale_id,
              name: l.name,
              description: l.description,
              sort_order: l.sort_order,
              _new: false,
            })),
          });
        })
        .catch(() => {});
    }
  }, [open]);

  const readOnly = mode === "view";
  /** In create mode, hide every other field until a shop type is selected. */
  const lockedByType = mode === "create" && !form.shop_type_id;
  const fieldsDisabled = readOnly || lockedByType;

  /** Auto-seed a locale row in the user's current language when type is first picked (create mode only). */
  useEffect(() => {
    if (mode !== "create") return;
    if (!form.shop_type_id) return;
    if (form.locales.length > 0) return;
    const base = currentLang.toLowerCase().split("-")[0];
    const match =
      locales.find((l) => l.code.toLowerCase() === currentLang.toLowerCase()) ??
      locales.find((l) => l.code.toLowerCase() === base) ??
      locales[0];
    if (!match) return;
    onFormChange({
      ...form,
      locales: [
        {
          locale_id: match.id,
          name: "",
          description: "",
          sort_order: 1,
          _new: true,
        },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, form.shop_type_id]);

  function setForm(patch: Partial<ShopFormState>) {
    onFormChange({ ...form, ...patch });
  }

  const addLocaleRow = () => {
    onFormChange({
      ...form,
      locales: [
        ...form.locales,
        {
          locale_id: "",
          name: "",
          description: "",
          sort_order: form.locales.length + 1,
          _new: true,
        },
      ],
    });
  };

  const updateLocaleRow = (idx: number, patch: Partial<ShopLocaleRow>) => {
    onFormChange({
      ...form,
      locales: form.locales.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    });
  };

  const removeLocaleRow = (idx: number) => {
    onFormChange({ ...form, locales: form.locales.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!form.code.trim() || !form.shop_type_id) {
      toast.error(t("createShop.errCodeType"));
      return;
    }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) {
        toast.error(t("createShop.errLocaleLang", { n: i + 1 }));
        return;
      }
      if (!row.name.trim()) {
        toast.error(t("createShop.errLocaleName", { n: i + 1 }));
        return;
      }
      if (!row.description.trim()) {
        toast.error(t("createShop.errLocaleDesc", { n: i + 1 }));
        return;
      }
    }

    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase().replace(/\s+/g, "_");
      const shopTypeId = Number(form.shop_type_id);
      const sortOrder = Number(form.sort_order) || 1;

      let shop;

      if (mode === "edit" && shopId != null) {
        await shopsApi.update(shopId, { code, shop_type_id: shopTypeId, sort_order: sortOrder });

        await Promise.all(
          form.locales.map((row) => {
            const body = {
              locale_id: Number(row.locale_id),
              name: row.name.trim(),
              description: row.description.trim(),
              sort_order: row.sort_order,
            };
            if (row._new || row.id == null) {
              return shopsApi.locales.add(shopId, body);
            }
            return shopsApi.locales.update(shopId, row.id, body);
          }),
        );

        ({ shop } = await shopsApi.get(shopId));
        toast.success(t("shopDialog.updatedToast"), { description: shop.code });
      } else {
        const localePayload = form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim(),
          sort_order: row.sort_order,
        }));
        const res = await shopsApi.create({ code, shop_type_id: shopTypeId, sort_order: sortOrder, locales: localePayload });
        ({ shop } = await shopsApi.get(res.id));
        const localeNote = localePayload.length
          ? ` · ${t("createShop.translationsCount", { count: localePayload.length })}`
          : "";
        toast.success(t("createShop.createdToast"), { description: `${shop.code}${localeNote}` });
      }

      await onSaved?.(shop);
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const titleKey =
    mode === "create"
      ? "shopDialog.titleCreate"
      : mode === "edit"
        ? "shopDialog.titleEdit"
        : "shopDialog.titleView";
  const descKey =
    mode === "create"
      ? "shopDialog.descCreate"
      : mode === "edit"
        ? "shopDialog.descEdit"
        : "shopDialog.descView";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t(descKey)}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={lockedByType ? "" : "grid grid-cols-2 gap-3"}>
            <div className="space-y-2">
              <Label>
                {t("createShop.shopType")}{" "}
                {mode === "create" && <span className="text-destructive">*</span>}
              </Label>
              {shopTypesLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("createShop.selectType")}…
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-56 overflow-y-auto pr-1">
                  {shopTypes.map((st) => {
                    const active = form.shop_type_id === st.id;
                    const monogram = st.code.slice(0, 2).toUpperCase();
                    const name = resolveShopTypeName(st, localeId);
                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={readOnly}
                        onClick={() => !readOnly && setForm({ shop_type_id: st.id })}
                        className={cn(
                          "group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
                          "hover:border-primary/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60",
                          active
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-md"
                            : "border-border bg-muted/20",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm transition-all",
                            active
                              ? "bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400 shadow-indigo-500/40"
                              : "bg-muted-foreground/20 text-muted-foreground group-hover:bg-gradient-to-br group-hover:from-fuchsia-500 group-hover:via-indigo-500 group-hover:to-cyan-400 group-hover:text-white",
                          )}
                        >
                          {monogram}
                        </div>
                        <span className={cn("text-xs font-medium leading-tight", active ? "text-primary" : "text-foreground")}>
                          {name}
                        </span>
                        {active && (
                          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {lockedByType && (
                <p className="text-xs text-muted-foreground">
                  {t("createShop.selectTypeFirst")}
                </p>
              )}
            </div>

            {!lockedByType && (
              <div className="space-y-2">
                <Label htmlFor="sort-order">{t("createShop.sortOrder")}</Label>
                <Input
                  id="sort-order"
                  type="number"
                  min={1}
                  value={form.sort_order}
                  onChange={(e) => setForm({ sort_order: Number(e.target.value) })}
                  required
                  disabled={fieldsDisabled}
                />
              </div>
            )}
          </div>

          {!lockedByType && (
          <>
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Languages className="h-4 w-4" />
                  {t("createShop.localeTranslations")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("createShop.localeHint")}
                </p>
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLocaleRow}
                  disabled={fieldsDisabled || (locales.length > 0 && form.locales.length >= locales.length)}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> {t("createShop.addLocale")}
                </Button>
              )}
            </div>

            {form.locales.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("createShop.noLocales")}
              </div>
            ) : (
              <div className="space-y-3">
                {form.locales.map((row, idx) => {
                  const localeMeta = locales.find((l) => l.id === row.locale_id);
                  const isNewRow = !!row._new;
                  const languageReadOnly =
                    fieldsDisabled || (mode === "edit" && !isNewRow);
                  return (
                    <div
                      key={row.id ?? `new-${idx}`}
                      className="space-y-3 rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          {localeMeta
                            ? `${localeMeta.name} (${localeMeta.code})`
                            : `Locale #${idx + 1}`}
                          {isNewRow && mode === "edit" && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              New
                            </span>
                          )}
                        </div>
                        {!fieldsDisabled && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeLocaleRow(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t("createShop.language")}</Label>
                          <Select
                            value={row.locale_id ? String(row.locale_id) : ""}
                            onValueChange={(v) =>
                              updateLocaleRow(idx, { locale_id: Number(v) })
                            }
                            disabled={languageReadOnly}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("createShop.selectLanguage")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {locales.map((l) => {
                                const taken = form.locales.some(
                                  (r, i) => i !== idx && r.locale_id === l.id,
                                );
                                return (
                                  <SelectItem
                                    key={l.id}
                                    value={String(l.id)}
                                    disabled={taken}
                                  >
                                    {l.name} ({l.code})
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t("createShop.sort")}</Label>
                          <Input
                            type="number"
                            value={row.sort_order}
                            onChange={(e) =>
                              updateLocaleRow(idx, {
                                sort_order: Number(e.target.value),
                              })
                            }
                            disabled={fieldsDisabled}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("createShop.name")}</Label>
                        <Input
                          value={row.name}
                          onChange={(e) =>
                            updateLocaleRow(idx, { name: e.target.value })
                          }
                          placeholder="Maya Boutique"
                          disabled={fieldsDisabled}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          {t("createShop.descriptionField")}
                        </Label>
                        <Textarea
                          value={row.description}
                          onChange={(e) =>
                            updateLocaleRow(idx, { description: e.target.value })
                          }
                          placeholder="Handcrafted apparel made in small batches…"
                          rows={2}
                          disabled={fieldsDisabled}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop-code">{t("createShop.shopCode")}</Label>
            <Input
              id="shop-code"
              value={form.code}
              onChange={(e) => setForm({ code: e.target.value })}
              placeholder="MAYA_BOUTIQUE"
              maxLength={50}
              required
              disabled={fieldsDisabled || mode === "edit"}
            />
            <p className="text-xs text-muted-foreground">
              {t("createShop.shopCodeHint")}
            </p>
          </div>
          </>
          )}

          <DialogFooter className="gap-2 sm:gap-2 border-t pt-4">
            {readOnly ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t("common.close")}
                </Button>
                {shopId != null && onModeChange && (
                  <Button type="button" onClick={() => onModeChange("edit")}>
                    <Pencil className="h-4 w-4 mr-1.5" /> {t("common.edit")}
                  </Button>
                )}
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
                  disabled={submitting || fieldsDisabled}
                  className="bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-400 text-white hover:brightness-110"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "edit" ? (
                    t("common.save")
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("createShop.createShop")}
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
