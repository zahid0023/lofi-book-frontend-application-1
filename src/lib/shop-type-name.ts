import type { ShopLocaleEmbedded, ShopTypeEmbedded } from "@/services/shops";
import type { ShopType } from "@/services/shop-types";

/** Maps a BCP-47 language tag to the locale_id used in the backend. */
export function localeIdFromLang(lang: string | undefined): number {
  const base = (lang ?? "en").toLowerCase().split("-")[0];
  const map: Record<string, number> = {
    en: 1,
    ar: 2,
    fr: 3,
    de: 4,
    bn: 5,
  };
  return map[base] ?? 1;
}

/** Returns the localized shop name, falling back to any available locale then code. */
export function resolveShopName(
  code: string,
  locales: ShopLocaleEmbedded[] | undefined,
  localeId: number,
): string {
  if (!locales?.length) return code;
  const match = locales.find((l) => l.locale_id === localeId) ?? locales[0];
  return match?.name || code;
}

/** Returns the localized shop description, falling back to any available locale then empty string. */
export function resolveShopDescription(
  locales: ShopLocaleEmbedded[] | undefined,
  localeId: number,
): string {
  if (!locales?.length) return "";
  const match = locales.find((l) => l.locale_id === localeId) ?? locales[0];
  return match?.description || "";
}

/** Returns the localized shop type name, falling back to the type code. */
export function resolveShopTypeName(
  shopType: ShopTypeEmbedded | ShopType | undefined,
  localeId: number,
): string {
  if (!shopType) return "—";
  const locales = shopType.shop_type_locales;
  if (!locales?.length) return shopType.code;
  const match =
    locales.find((l) => l.locale_id === localeId) ?? locales[0];
  return match?.name || shopType.code;
}
