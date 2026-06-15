import { useNavigate } from "react-router-dom";
import { Button } from "rsuite";
import { MotionIcon } from "motion-icons-react";
import PageLayout from "../components/PageLayout";

export default function WorkInProgressPage() {
  const navigate = useNavigate();

  return (
    <PageLayout className="wip-page" mainClassName="wip-container">
      <h1 className="wip-title">Work in Progress</h1>
      <Button className="btn-play" size="lg" onClick={() => navigate(-1)}>
        <MotionIcon
          name="ArrowLeft"
          size={18}
          trigger="hover"
          animation="nudge"
          className="wip-icon"
        />
        Geri Dön
      </Button>
    </PageLayout>
  );
}
