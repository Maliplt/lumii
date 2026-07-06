import type { ReactNode } from "react";

interface ModalHeroProps {
  className: string;
  avatar?: string;
  title: ReactNode;
  description: ReactNode | ReactNode[];
}

// modal başlığı
export default function ModalHero({ className, avatar, title, description }: ModalHeroProps) {
  const paragraphs = Array.isArray(description) ? description : [description];

  return (
    <div className={className}>
      {avatar && <img src={avatar} alt="" />}
      <h2>{title}</h2>
      {paragraphs.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  );
}
