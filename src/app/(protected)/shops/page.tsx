"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, Plus, Sparkles, Store } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { ShopCard } from "@/components/shops/shop-card";
import { ShopDialog } from "@/components/shops/shop-dialog";
import { emptyShopForm, type ShopDialogMode, type ShopFormState } from "@/components/shops/types";
import { logout } from "@/services/auth";
import { getToken } from "@/services/api";
import { shopsApi, type Shop } from "@/services/shops";

export default function ShopsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [hasToken] = useState(() => !!getToken());
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<ShopDialogMode>("create");
  const [activeShopId, setActiveShopId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<ShopFormState>(emptyShopForm);

  useEffect(() => {
    if (!hasToken) {
      router.replace("/login");
      return;
    }
    shopsApi
      .list({ size: 50 })
      .then((res) => setShops(res.data))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [hasToken, router]);

  const openCreate = () => {
    setActiveShopId(undefined);
    setForm({ ...emptyShopForm, sort_order: shops.length + 1 });
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openFor = (shop: Shop, mode: ShopDialogMode) => {
    setActiveShopId(shop.id);
    setForm({ code: shop.code, shop_type_id: shop.shop_type?.id ?? "", sort_order: shop.sort_order, locales: [] });
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!hasToken) return null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col p-6 sm:p-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-fuchsia-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            {t("common.appName")}
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> {t("common.signOut")}
            </Button>
          </div>
        </header>

        <section className="mt-10 flex flex-1 flex-col">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Store className="h-3.5 w-3.5" /> {t("shops.yourShops")}
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                {t("shops.subtitle")}
              </h1>
            </div>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-400 font-medium text-white shadow-lg shadow-indigo-500/30 hover:brightness-110"
            >
              <Plus className="mr-2 h-4 w-4" /> {t("shops.newShop")}
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : shops.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("shops.noShopsTitle")}</CardTitle>
                <CardDescription>{t("shops.noShopsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={openCreate}
                  className="bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-400 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" /> {t("shops.createAShop")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  onOpen={(s) => router.push(`/shops/${s.id}/dashboard`)}
                  onView={(s) => openFor(s, "view")}
                  onEdit={(s) => openFor(s, "edit")}
                  onDelete={(s) => toast.warning(t("shops.deleteComingSoon", { code: s.code }))}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <ShopDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        onModeChange={setDialogMode}
        shopId={activeShopId}
        form={form}
        onFormChange={setForm}
        onSaved={(shop) =>
          setShops((prev) => {
            const exists = prev.some((s) => s.id === shop.id);
            return exists ? prev.map((s) => (s.id === shop.id ? shop : s)) : [shop, ...prev];
          })
        }
      />
    </main>
  );
}
