import type { PackageDef } from "../../../types/types";
import type { PendingPlanChange } from "../../../store/authSlice";

export type Plan = PackageDef;

export interface BasicUser {
  name: string;
  email: string;
  createdAt?: string;
  pendingPlanChange?: PendingPlanChange | null;
}
