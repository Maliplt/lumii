import { useMemo } from "react";
import { useAppSelector } from "../store/store";
import { contentAudienceKey } from "./contentPersonalization";

export function useContentAudienceKey(): string {
  const activeProfileId = useAppSelector((state) => state.auth.activeProfileId);
  const userEmail = useAppSelector((state) => state.auth.currentUser?.email);

  return useMemo(
    () => contentAudienceKey(userEmail, activeProfileId),
    [activeProfileId, userEmail],
  );
}
