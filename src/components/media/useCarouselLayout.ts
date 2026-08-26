import { useSyncExternalStore } from "react";

const subscribers = new Set<() => void>();
let currentCount = 6;
let listening = false;

export function visibleCarouselItems(width: number): number {
  if (width <= 480) return 2;
  if (width <= 768) return 3;
  if (width <= 1024) return 4;
  return 6;
}

export function shouldRenderCarouselPage(page: number, current: number): boolean {
  return Math.abs(page - current) <= 1;
}

function readViewportCount(): number {
  return typeof window === "undefined"
    ? 6
    : visibleCarouselItems(window.innerWidth);
}

function updateViewportCount() {
  const next = readViewportCount();
  if (next === currentCount) return;
  currentCount = next;
  subscribers.forEach((notify) => notify());
}

function subscribe(notify: () => void): () => void {
  subscribers.add(notify);
  if (!listening) {
    currentCount = readViewportCount();
    window.addEventListener("resize", updateViewportCount, { passive: true });
    listening = true;
  }

  return () => {
    subscribers.delete(notify);
    if (subscribers.size === 0 && listening) {
      window.removeEventListener("resize", updateViewportCount);
      listening = false;
    }
  };
}

export function useCarouselVisibleCount(): number {
  return useSyncExternalStore(subscribe, readViewportCount, () => 6);
}
