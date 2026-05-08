"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Check, FolderTree, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocaleId } from "@/lib/use-locale-id";
import {
  platformItemCategoriesApi,
  type PlatformItemCategory,
} from "@/services/platform-item-categories";

interface Props {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
}

export function PlatformCategoryTreeSelect({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const localeId = useLocaleId();
  const [open, setOpen] = useState(false);

  const [roots, setRoots] = useState<PlatformItemCategory[]>([]);
  const [rootsLoading, setRootsLoading] = useState(false);
  const [childrenMap, setChildrenMap] = useState<Map<number, PlatformItemCategory[]>>(new Map());
  const [loadingSet, setLoadingSet] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Fetch the selected category by ID so we can show its label before the tree is opened
  const [selectedCat, setSelectedCat] = useState<PlatformItemCategory | null>(null);

  // All nodes we've loaded so far, keyed by id
  const allLoaded = useMemo(() => {
    const m = new Map<number, PlatformItemCategory>();
    roots.forEach((c) => m.set(c.id, c));
    childrenMap.forEach((children) => children.forEach((c) => m.set(c.id, c)));
    return m;
  }, [roots, childrenMap]);

  // Fetch root categories when the popover first opens
  useEffect(() => {
    if (!open || roots.length > 0) return;
    setRootsLoading(true);
    platformItemCategoriesApi
      .listRoot({ size: 50 })
      .then((res) => setRoots(res.data))
      .catch(() => {})
      .finally(() => setRootsLoading(false));
  }, [open]);

  // Keep selectedCat in sync for label display
  useEffect(() => {
    if (!value) {
      setSelectedCat(null);
      return;
    }
    if (allLoaded.has(value)) {
      setSelectedCat(allLoaded.get(value)!);
      return;
    }
    platformItemCategoriesApi
      .get(value)
      .then((res) => setSelectedCat(res.platform_item_category))
      .catch(() => {});
  }, [value, allLoaded]);

  const fetchChildren = (id: number) => {
    if (childrenMap.has(id) || loadingSet.has(id)) return;
    setLoadingSet((s) => new Set(s).add(id));
    platformItemCategoriesApi
      .listSubCategories(id, { size: 50 })
      .then((res) => setChildrenMap((m) => new Map(m).set(id, res.data)))
      .catch(() => {})
      .finally(() =>
        setLoadingSet((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        }),
      );
  };

  const toggle = (id: number, hasChildren: boolean) => {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
        if (hasChildren) fetchChildren(id);
      }
      return n;
    });
  };

  const localized = (c: PlatformItemCategory) =>
    c.platform_item_category_locales?.find((l) => l.locale_id === localeId)?.name ??
    c.platform_item_category_locales?.[0]?.name ??
    c.code;

  const selectedLabel = useMemo(() => {
    if (!value) return null;
    const cat = allLoaded.get(value) ?? selectedCat;
    if (!cat) return `#${value}`;
    const trail: string[] = [];
    let cur: PlatformItemCategory | undefined = cat;
    while (cur) {
      trail.unshift(localized(cur));
      cur = cur.parent_id ? allLoaded.get(cur.parent_id) : undefined;
    }
    return trail.join(" › ");
  }, [value, allLoaded, selectedCat]);

  const renderNode = (cat: PlatformItemCategory, depth: number) => {
    const hasChildren = (cat.sub_category_count ?? 0) > 0;
    const isExpanded = expanded.has(cat.id);
    const isSelected = value === cat.id;
    const isLoading = loadingSet.has(cat.id);
    const children = childrenMap.get(cat.id) ?? [];

    return (
      <div key={cat.id}>
        <div
          className={
            "flex items-center gap-1 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted " +
            (isSelected ? "bg-primary/10 text-primary" : "")
          }
          style={{ paddingLeft: 6 + depth * 14 }}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggle(cat.id, hasChildren)}
            className="flex h-5 w-5 items-center justify-center text-muted-foreground"
            aria-label="toggle"
          >
            {hasChildren ? (
              isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )
            ) : (
              <span className="block h-1 w-1 rounded-full bg-muted-foreground/40" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(cat.id);
              setOpen(false);
            }}
            className="flex flex-1 items-center justify-between gap-2 truncate text-left"
          >
            <span className="truncate">
              {localized(cat)}{" "}
              <span className="text-xs text-muted-foreground">({cat.code})</span>
            </span>
            {isSelected && <Check className="h-4 w-4 shrink-0" />}
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div>{children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <FolderTree className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {selectedLabel ??
                t("itemCategory.selectPlatformCategory", "Select platform category")}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
        <div className="max-h-72 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={
              "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted " +
              (value === null ? "bg-primary/10 text-primary" : "")
            }
          >
            <span>{t("itemCategory.noPlatformCategory", "None")}</span>
            {value === null && <Check className="h-4 w-4" />}
          </button>
          <div className="my-1 border-t" />
          {rootsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : roots.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              {t("common.empty", "Nothing here")}
            </p>
          ) : (
            roots.map((cat) => renderNode(cat, 0))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
