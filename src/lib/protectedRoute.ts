import { useOutletContext } from "react-router-dom";
import type { CurrentUser } from "../store/store";

export interface ProtectedRouteContext {
  currentUser: CurrentUser;
}

export function useProtectedUser(): CurrentUser {
  return useOutletContext<ProtectedRouteContext>().currentUser;
}
