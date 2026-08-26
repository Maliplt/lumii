import type { MotionIconName } from "../ui/MotionIcon";

// nav linkleri
export const NAV_LINKS = [
  { to: "/", label: "Ana Sayfa", icon: "Home" },
  { to: "/explore", label: "Seç İzle", icon: "Film" },
  { to: "/tv", label: "TV İzle", icon: "Tv" },
] satisfies ReadonlyArray<{
  to: string;
  label: string;
  icon: MotionIconName;
}>;
