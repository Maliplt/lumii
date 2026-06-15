import { useState } from "react";
import { MotionIcon } from "motion-icons-react";
import PageLayout from "../components/PageLayout";
import MediaPlayer from "../components/MediaPlayer";
import { getStreamSource } from "../services/player";

interface Channel {
  id: string;
  name: string;
}

const CHANNELS: Channel[] = [
  { id: "k1", name: "Kanal 1" },
  { id: "k2", name: "Kanal 2" },
  { id: "k3", name: "Kanal 3" },
  { id: "k4", name: "Kanal 4" },
  { id: "k5", name: "Kanal 5" },
];

export default function TvPage() {
  const [selected, setSelected] = useState<Channel>(CHANNELS[0]);

  return (
    <PageLayout className="tv-page" mainClassName="tv-main">
      <div className="tv-layout">
        <div className="tv-sidebar">
          <h2 className="tv-sidebar__title">Kanallar</h2>
          <div className="tv-channel-list">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                className={`tv-channel-item${selected.id === channel.id ? " active" : ""}`}
                onClick={() => setSelected(channel)}
              >
                <div className="tv-channel-item__logo">
                  <MotionIcon
                    name="Tv2"
                    size={20}
                    trigger="hover"
                    animation="pop"
                  />
                </div>
                <span className="tv-channel-item__name">{channel.name}</span>
                <span className="tv-channel-item__live" />
              </button>
            ))}
          </div>
        </div>

        <div className="tv-featured">
          <MediaPlayer
            key={selected.id}
            src={getStreamSource()}
            title={selected.name}
            live
            startMuted
            className="tv-featured__player"
          />
        </div>
      </div>
    </PageLayout>
  );
}
