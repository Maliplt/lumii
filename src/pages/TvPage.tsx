import { useState } from "react";
import PageLayout from "../components/PageLayout";
import MediaPlayer from "../components/MediaPlayer";
import { useTitle } from "../helpers";

interface Channel {
  id: string;
  name: string;
  short: string;
  category: string;
  url: string;
}

// yalnizca ercdn.net akislari tutuluyor
const CHANNELS: Channel[] = [
  {
    id: "atv",
    name: "ATV",
    short: "atv",
    category: "Genel",
    url: "https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/atv/atv.m3u8",
  },
  {
    id: "ahaber",
    name: "A Haber",
    short: "AH",
    category: "Haber",
    url: "https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/ahaber/ahaber.m3u8",
  },
  {
    id: "aspor",
    name: "A Spor",
    short: "AS",
    category: "Spor",
    url: "https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8",
  },
  {
    id: "tv360",
    name: "360 TV",
    short: "360",
    category: "Genel",
    url: "https://turkmedya-live.ercdn.net/tv360/tv360.m3u8",
  },
];

export default function TvPage() {
  useTitle("TV İzle");
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
                <span className="tv-channel-item__logo" aria-hidden="true">
                  {channel.short}
                </span>
                <span className="tv-channel-item__texts">
                  <span className="tv-channel-item__name">{channel.name}</span>
                  <span className="tv-channel-item__cat">{channel.category}</span>
                </span>
                <span className="tv-channel-item__live">
                  <span className="tv-channel-item__live-dot" />
                  CANLI
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="tv-featured">
          <MediaPlayer
            key={selected.id}
            src={selected.url}
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
