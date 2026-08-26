import type { IframeHTMLAttributes } from "react";

type TrailerEmbedFrameProps = Pick<
  IframeHTMLAttributes<HTMLIFrameElement>,
  "className" | "onLoad" | "src" | "title"
>;

export default function TrailerEmbedFrame(props: TrailerEmbedFrameProps) {
  return (
    <iframe
      {...props}
      allow="autoplay; encrypted-media"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
