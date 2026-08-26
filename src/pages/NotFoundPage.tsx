import { useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import ServiceErrorView from "../components/feedback/ServiceErrorView";
import { useTitle } from "../helpers";
import { ServiceError } from "../services/serviceError";

const NOT_FOUND_ERROR = new ServiceError("not-found");

export default function NotFoundPage() {
  const navigate = useNavigate();
  useTitle("İçerik Bulunamadı");

  return (
    <PageLayout
      className="notfound-page"
      mainClassName="notfound-container"
    >
      <ServiceErrorView
        error={NOT_FOUND_ERROR}
        onBack={() => navigate(-1)}
      />
    </PageLayout>
  );
}
