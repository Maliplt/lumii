import { useMemo, useState } from "react";
import { Lock, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import MediaPlayer from "../components/player/MediaPlayer";
import ChannelLogo, { type Channel } from "../components/ChannelLogo";
import { canAccessChannel, channelAccessLevel, getPlan, requiredPlanName, upgradeCtaLabel, useTitle } from "../helpers";
import { useAppSelector } from "../store/store";
import channelsData from "../data/channels.json";

// yayin akisi listesi
const CHANNELS: Channel[] = channelsData;

export default function TvPage() {
  useTitle("TV İzle");
  const navigate = useNavigate();
  const userPlan = useAppSelector((s) => s.auth.currentUser?.plan);
  const plan = getPlan(userPlan);
  const [selected, setSelected] = useState<Channel>(CHANNELS[0]);
  const [lockedChannel, setLockedChannel] = useState<Channel | null>(null);
  const lockedChannelIndex = lockedChannel
    ? CHANNELS.findIndex((channel) => channel.id === lockedChannel.id)
    : -1;
  const lockedChannelLevel = channelAccessLevel(Math.max(0, lockedChannelIndex), lockedChannel?.category);
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

  const switchChannel = (direction: -1 | 1) => {
    const currentIndex = CHANNELS.findIndex((channel) => channel.id === selected.id);
    const nextIndex = (currentIndex + direction + CHANNELS.length) % CHANNELS.length;
    const nextChannel = CHANNELS[nextIndex];
    if (!canAccessChannel(userPlan, nextIndex, nextChannel.category)) {
      setLockedChannel(nextChannel);
      return;
    }
    setLockedChannel(null);
    setSelected(nextChannel);
  };

  return (
    <PageLayout className="tv-page" mainClassName="tv-main">
      <div className="tv-layout">
        <div className="tv-sidebar">
          <div className="tv-search">
            <Search size={17} className="tv-search__glyph" />
            <input
              type="text"
              className="tv-search__input"
              placeholder="Kanal veya kategori ara"
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
                    className={`tv-channel-item${selected.id === channel.id && !lockedChannel ? " active" : ""}${canAccessChannel(userPlan, no - 1, channel.category) ? "" : " is-locked"}`}
                    onClick={() => {
                      if (!canAccessChannel(userPlan, no - 1, channel.category)) {
                        setLockedChannel(channel);
                        return;
                      }
                      setLockedChannel(null);
                      setSelected(channel);
                    }}
                  >
                    <span className="tv-channel-item__no">{no}</span>
                    <ChannelLogo channel={channel} />
                    <span className="tv-channel-item__texts">
                      <span className="tv-channel-item__name">
                        {channel.name}
                      </span>
                    </span>
                    <span className="tv-channel-item__live">
                      {canAccessChannel(userPlan, no - 1, channel.category) ? (
                        <span className="tv-channel-item__live-dot" title="Canlı yayın" aria-label="Canlı yayın" />
                      ) : (
                        <span className="tv-channel-item__lock" title={`${requiredPlanName(channelAccessLevel(no - 1, channel.category))} paketine dahil`}>
                          <Lock size={15} />
                        </span>
                      )}
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
            maxVideoHeight={plan.capabilities.maxVideoHeight}
            qualityLabel={plan.quality}
            onPrevious={() => switchChannel(-1)}
            onNext={() => switchChannel(1)}
          />
          {lockedChannel && (
            <div className="tv-access-gate" role="status">
              <span className="tv-access-gate__icon" aria-hidden="true"><Lock size={26} /></span>
              <h2>{lockedChannel.name}</h2>
              <p>Bu kanal {requiredPlanName(lockedChannelLevel)} paketine dahildir.</p>
              <button type="button" onClick={() => navigate("/packages")}>{upgradeCtaLabel(lockedChannelLevel)}</button>
              <button type="button" className="is-secondary" onClick={() => setLockedChannel(null)}>Yayına Dön</button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
