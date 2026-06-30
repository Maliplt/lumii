import {
  Bookmark,
  Crown,
  CreditCard,
  History,
  Settings,
  ShieldCheck,
  ThumbsUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AVATARS, DEFAULT_AVATAR, PACKAGES } from "../../helpers";
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

export const PLAN_FALLBACK =
  PACKAGES.find((pkg) => pkg.id === "free") ?? PACKAGES[0];

export function formatPlan(plan: (typeof PACKAGES)[number]) {
  if (plan.free || plan.price === "₺0") return plan.name;
  return `${plan.name} ${plan.price}${plan.period}`;
}

export function avatarFor(profile?: Profile | null) {
  return AVATARS[profile?.avatar ?? DEFAULT_AVATAR] ?? AVATARS[DEFAULT_AVATAR];
}
