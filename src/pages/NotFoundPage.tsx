import { useNavigate } from "react-router-dom";
import { Button } from "rsuite";
import { MotionIcon } from "motion-icons-react";
import { MonitorX } from "lucide-react";
import PageLayout from "../components/PageLayout";
import { useTitle } from "../helpers";

interface NotFoundPageProps {
  title?: string;
  description?: string;
  standalone?: boolean;
}

export default function NotFoundPage({
  title = "Aradığınız içeriğe şu anda ulaşamıyoruz",
  description = "İçerik kaldırılmış, taşınmış veya artık yayında olmayabilir.",
  standalone = false,
}: NotFoundPageProps) {
  const navigate = useNavigate();
  useTitle("İçerik Bulunamadı");

  return (
    <PageLayout
      className={`notfound-page${standalone ? " notfound-page--standalone" : ""}`}
      mainClassName="notfound-container"
    >
      <MonitorX className="notfound-broken" size={28} strokeWidth={1.5} aria-hidden="true" />
      <p className="notfound-code">404</p>
      <h1 className="notfound-title">{title}</h1>
      <p className="notfound-desc">{description}</p>
      <div className="notfound-actions">
        <Button className="btn-play" size="lg" onClick={() => navigate("/")}>
          <MotionIcon
            name="House"
            size={18}
            trigger="hover"
            animation="nudge"
            className="notfound-icon"
          />
          Ana Sayfaya Dön
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
          Önceki Sayfa
        </Button>
      </div>
    </PageLayout>
  );
}
