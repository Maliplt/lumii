import { useEffect, useMemo, type ReactNode } from "react";
import {
  createTrailerPreviewCoordinator,
  TrailerPreviewContext,
} from "../../lib/trailerPreviewContext";

export default function TrailerPreviewProvider({
  children,
}: {
  children: ReactNode;
}) {
  const coordinator = useMemo(() => createTrailerPreviewCoordinator(), []);

  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.hidden) coordinator.stop();
    };
    document.addEventListener("visibilitychange", stopWhenHidden);
    window.addEventListener("pagehide", coordinator.stop);
    return () => {
      document.removeEventListener("visibilitychange", stopWhenHidden);
      window.removeEventListener("pagehide", coordinator.stop);
      coordinator.stop();
    };
  }, [coordinator]);

  return (
    <TrailerPreviewContext.Provider value={coordinator}>
      {children}
    </TrailerPreviewContext.Provider>
  );
}
