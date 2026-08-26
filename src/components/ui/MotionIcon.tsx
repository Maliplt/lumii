import { memo } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Cookie,
  Crown,
  Eye,
  EyeOff,
  FileText,
  Film,
  Heart,
  Home,
  Lock,
  LogOut,
  Menu,
  Play,
  Plus,
  Search,
  Shield,
  Trophy,
  Tv,
  User,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS = {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Cookie,
  Crown,
  Eye,
  EyeOff,
  FileText,
  Film,
  Heart,
  Home,
  Lock,
  LogOut,
  Menu,
  Play,
  Plus,
  Search,
  Shield,
  Trophy,
  Tv,
  User,
  Users,
  X,
  Zap,
} satisfies Record<string, LucideIcon>;

export type MotionIconName = keyof typeof ICONS;

interface MotionIconProps {
  name: MotionIconName;
  size?: number;
  className?: string;
  trigger?: "hover" | "click";
  animation?: "pop" | "nudge" | "heartbeat";
}

export const MotionIcon = memo(function MotionIcon({
  name,
  size = 20,
  className = "",
  trigger = "hover",
  animation = "pop",
}: MotionIconProps) {
  const Icon = ICONS[name];
  if (!Icon) return null;

  return (
    <Icon
      size={size}
      className={`app-motion-icon${className ? ` ${className}` : ""}`}
      data-motion-trigger={trigger}
      data-motion-animation={animation}
      aria-hidden="true"
    />
  );
});
