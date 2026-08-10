import { useParams } from "react-router-dom";
import NotFoundPage from "./NotFoundPage";
import OverviewContent from "./overview/OverviewContent";

export default function OverviewPage() {
  const { type, id } = useParams<{ type: "movie" | "tv"; id: string }>();
  if (!type || !id || (type !== "movie" && type !== "tv")) {
    return <NotFoundPage />;
  }
  return <OverviewContent key={`${type}-${id}`} type={type} id={id} />;
}
