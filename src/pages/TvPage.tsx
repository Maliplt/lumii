import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import PageLayout from "../components/PageLayout";
import MediaPlayer from "../components/player/MediaPlayer";
import ChannelLogo, { type Channel } from "../components/ChannelLogo";
import { useTitle } from "../helpers";
import channelsData from "../data/channels.json";

// yayin akisi listesi
const CHANNELS: Channel[] = channelsData;

export default function TvPage() {
  useTitle("TV İzle");
  const [selected, setSelected] = useState<Channel>(CHANNELS[0]);
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    const matches = CHANNELS.map((channel, index) => ({
      channel,
      no: index + 1,
    })).filter(
      ({ channel }) =>
        !q ||
        channel.name.toLocaleLowerCase("tr").includes(q) ||
        channel.category.toLocaleLowerCase("tr").includes(q),
    );
    const out: { category: string; items: typeof matches }[] = [];
    for (const entry of matches) {
      let group = out.find((g) => g.category === entry.channel.category);
      if (!group) {
        group = { category: entry.channel.category, items: [] };
        out.push(group);
      }
      group.items.push(entry);
    }
    return out;
  }, [query]);

  const hasResults = groups.length > 0;

  return (
    <PageLayout className="tv-page" mainClassName="tv-main">
      <div className="tv-layout">
        <div className="tv-sidebar">
          <h2 className="tv-sidebar__title">Kanal Listesi</h2>

          <div className="tv-search">
            <Search size={17} className="tv-search__glyph" />
            <input
              type="text"
              className="tv-search__input"
              placeholder={`Kanal veya kategori ara · ${CHANNELS.length} kanal`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="tv-search__clear"
                onClick={() => setQuery("")}
                aria-label="Temizle"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="tv-channel-list">
            {groups.map((group) => (
              <div key={group.category} className="tv-channel-group">
                <h3 className="tv-channel-group__title">{group.category}</h3>
                {group.items.map(({ channel, no }) => (
                  <button
                    key={channel.id}
                    className={`tv-channel-item${selected.id === channel.id ? " active" : ""}`}
                    onClick={() => setSelected(channel)}
                  >
                    <span className="tv-channel-item__no">{no}</span>
                    <ChannelLogo channel={channel} />
                    <span className="tv-channel-item__texts">
                      <span className="tv-channel-item__name">
                        {channel.name}
                      </span>
                    </span>
                    <span className="tv-channel-item__live">
                      <span className="tv-channel-item__live-dot" />
                      CANLI
                    </span>
                  </button>
                ))}
              </div>
            ))}
            {!hasResults && (
              <p className="tv-channel-empty">"{query}" için kanal bulunamadı.</p>
            )}
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
