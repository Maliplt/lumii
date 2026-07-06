import type { PackageDef } from "../../../types/types";

export type Plan = PackageDef;

export interface BasicUser {
  name: string;
  email: string;
  createdAt?: string;
}
