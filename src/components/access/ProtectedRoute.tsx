import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../../store/store";

export default function ProtectedRoute() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const location = useLocation();

  if (currentUser) return <Outlet context={{ currentUser }} />;

  const requestedPath = `${location.pathname}${location.search}${location.hash}`;
  const returnTo = location.pathname === "/profiles" ? "/" : requestedPath;

  return <Navigate to="/login" replace state={{ returnTo }} />;
}
