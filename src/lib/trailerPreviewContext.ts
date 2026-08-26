import { createContext } from "react";

export type TrailerPreviewPriority = "automatic" | "user";

interface PreviewLease {
  owner: symbol;
  priority: TrailerPreviewPriority;
  cancel: () => void;
}

export interface TrailerPreviewCoordinator {
  claim: (lease: PreviewLease) => boolean;
  owns: (owner: symbol) => boolean;
  release: (owner: symbol) => void;
  stop: () => void;
}

const PRIORITY: Record<TrailerPreviewPriority, number> = {
  automatic: 1,
  user: 2,
};

export function createTrailerPreviewCoordinator(): TrailerPreviewCoordinator {
  let active: PreviewLease | null = null;

  return {
    claim(next) {
      if (active?.owner === next.owner) {
        active = next;
        return true;
      }
      if (active && PRIORITY[active.priority] > PRIORITY[next.priority]) {
        return false;
      }

      const previous = active;
      active = next;
      previous?.cancel();
      return true;
    },
    owns(owner) {
      return active?.owner === owner;
    },
    release(owner) {
      if (active?.owner === owner) active = null;
    },
    stop() {
      const current = active;
      active = null;
      current?.cancel();
    },
  };
}

export const TrailerPreviewContext =
  createContext<TrailerPreviewCoordinator | null>(null);
