import { Bookmark, Crown, CreditCard, History, Settings, ShieldCheck, ThumbsUp, UserRound, Users, type LucideIcon } from "lucide-react";
import { PACKAGES, findPackage } from "../../helpers";
import type { Profile } from "../../store/store";

export type SectionKey =
  | "overview"
  | "profiles"
  | "membership"
  | "security"
  | "billing"
  | "settings"
  | "watchlist"
  | "liked"
  | "history";

export interface NavItem {
  key: SectionKey;
  label: string;
  helper: string;
  icon: LucideIcon;
}

export interface EditorState {
  mode: "create" | "edit";
  profile?: Profile;
}

export interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

export const ACCOUNT_NAV: NavItem[] = [
  { key: "overview", label: "Hesap", helper: "Genel durum", icon: UserRound },
  { key: "profiles", label: "Profiller", helper: "Kullanıcı profilleri", icon: Users },
  { key: "membership", label: "Üyelik", helper: "Abonelik", icon: Crown },
  { key: "security", label: "Güvenlik", helper: "Giriş ve cihazlar", icon: ShieldCheck },
  { key: "billing", label: "Ödeme", helper: "Fatura ve kart", icon: CreditCard },
  { key: "settings", label: "Ayarlar", helper: "Aktif profil", icon: Settings },
];

export const LIBRARY_NAV: NavItem[] = [
  { key: "watchlist", label: "Kaydedilenler", helper: "Kaydedilenler", icon: Bookmark },
  { key: "liked", label: "Beğenilenler", helper: "Seçilen içerikler", icon: ThumbsUp },
  { key: "history", label: "Geçmiş", helper: "Son izlenenler", icon: History },
];

export const PLAN_FALLBACK = findPackage("free") ?? PACKAGES[0];

export function formatPlan(plan: (typeof PACKAGES)[number]) {
  if (plan.free || plan.price === "₺0") return plan.name;
  return `${plan.name} ${plan.price}${plan.period}`;
}

export function validatePassword(
  current: string,
  next: string,
  confirm: string,
  actualPassword: string,
): { message: string; type: "warning" | "error" } | null {
  if (!current || !next || !confirm) {
    return { message: "Tüm şifre alanlarını doldurmalısın.", type: "warning" };
  }
  if (actualPassword !== current) {
    return { message: "Mevcut şifre hatalı.", type: "error" };
  }
  if (next.length < 8 || next === current) {
    return {
      message: "Yeni şifre en az 8 karakter olmalı ve eskisinden farklı olmalı.",
      type: "warning",
    };
  }
  if (next !== confirm) {
    return { message: "Yeni şifreler eşleşmiyor.", type: "warning" };
  }
  return null;
}
