import { useEffect, useRef, type ReactNode } from "react";
import { animate } from "animejs";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current)
      animate(cardRef.current, {
        opacity: [0, 1],
        translateY: [28, 0],
        duration: 600,
        easing: "easeOutQuart",
      });
  }, []);

  return (
    <div className="login-card" ref={cardRef}>
      <div className="login-card__head">
        <h1 className="login-card__title">{title}</h1>
        <p className="login-card__subtitle">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
