import { Navigate, useParams } from "react-router-dom";
import OverviewContent from "./overview/OverviewContent";

export default function OverviewPage() {
  const { type, id } = useParams<{ type: "movie" | "tv"; id: string }>();
  if (
    !type ||
    !id ||
    (type !== "movie" && type !== "tv") ||
    !/^\d+$/.test(id) ||
    Number(id) <= 0
  ) {
    return <Navigate to="/404" replace />;
  }
  return <OverviewContent key={`${type}-${id}`} type={type} id={id} />;
}
