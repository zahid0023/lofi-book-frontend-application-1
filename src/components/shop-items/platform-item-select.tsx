"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Package, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocaleId } from "@/lib/use-locale-id";
import { platformItemsApi, type PlatformItem } from "@/services/platform-items";

interface Props {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
}

export function PlatformItemSelect({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const localeId = useLocaleId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<PlatformItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PlatformItem | null>(null);

  const localized = (item: PlatformItem) =>
    item.platform_item_locales?.find((l) => l.locale_id === localeId)?.name ??
    item.platform_item_locales?.[0]?.name ??
    item.code;

  // Fetch all items when popover first opens
  useEffect(() => {
    if (!open || items.length > 0) return;
    setLoading(true);
    platformItemsApi
      .list({ size: 50 })
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Resolve label for the selected value if not yet in loaded list
  useEffect(() => {
    if (!value) { setSelectedItem(null); return; }
    const found = items.find((i) => i.id === value);
    if (found) { setSelectedItem(found); return; }
    platformItemsApi
      .get(value)
      .then((res) => setSelectedItem(res.platform_item))
      .catch(() => {});
  }, [value, items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.code.toLowerCase().includes(q) ||
        localized(i).toLowerCase().includes(q),
    );
  }, [items, search, localeId]);

  const selectedLabel = selectedItem
    ? `${localized(selectedItem)} (${selectedItem.code})`
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selectedLabel ??
                t("shopItem.selectPlatformItem", "Select a platform item")}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {/* Search */}
        <div className="border-b p-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("shopItem.searchPlatformItem", "Search…")}
            className="h-8 text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto p-1">
          {/* Clear / none option */}
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className={
              "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted " +
              (value === null ? "bg-primary/10 text-primary" : "")
            }
          >
            <span className="flex items-center gap-2">
              <X className="h-3.5 w-3.5" />
              {t("shopItem.noPlatformItem", "None")}
            </span>
            {value === null && <Check className="h-4 w-4" />}
          </button>

          <div className="my-1 border-t" />

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              {t("common.empty", "Nothing here")}
            </p>
          ) : (
            filtered.map((item) => {
              const isSelected = value === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onChange(item.id); setOpen(false); }}
                  className={
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted " +
                    (isSelected ? "bg-primary/10 text-primary" : "")
                  }
                >
                  <span className="flex min-w-0 flex-col items-start">
                    <span className="truncate font-medium">{localized(item)}</span>
                    <span className="text-xs text-muted-foreground">{item.code}</span>
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
