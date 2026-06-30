import { useNavigate } from "react-router-dom";
import { Button } from "rsuite";
import { MotionIcon } from "motion-icons-react";
import PageLayout from "../components/PageLayout";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageLayout className="notfound-page" mainClassName="notfound-container">
      <p className="notfound-code">404</p>
      <h1 className="notfound-title">Sayfa bulunamadı</h1>
      <p className="notfound-desc">
        Aradığın sayfa taşınmış veya hiç var olmamış olabilir.
      </p>
      <div className="notfound-actions">
        <Button className="btn-play" size="lg" onClick={() => navigate("/")}>
          <MotionIcon
            name="House"
            size={18}
            trigger="hover"
            animation="nudge"
            className="notfound-icon"
          />
          Ana Sayfa
        </Button>
        <Button
          className="btn-secondary"
          size="lg"
          appearance="ghost"
          onClick={() => navigate(-1)}
        >
          <MotionIcon
            name="ArrowLeft"
            size={18}
            trigger="hover"
            animation="nudge"
            className="notfound-icon"
          />
          Geri Dön
        </Button>
      </div>
    </PageLayout>
  );
}
