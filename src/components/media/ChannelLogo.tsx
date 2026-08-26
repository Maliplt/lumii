import { useState } from "react";
import OptimizedImage from "../ui/OptimizedImage";

export interface Channel {
  id: string;
  name: string;
  short: string;
  category: string;
  logo: string;
  url: string;
}

// logo yedeği
export default function ChannelLogo({ channel }: { channel: Channel }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="tv-channel-item__logo tv-channel-item__logo--text">
        {channel.short}
      </span>
    );
  }
  return (
    <span className="tv-channel-item__logo">
      <OptimizedImage
        src={channel.logo}
        alt=""
        onError={() => setFailed(true)}
      />
    </span>
  );
}
