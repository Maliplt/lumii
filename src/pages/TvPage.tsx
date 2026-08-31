import { useMemo, useState } from "react";
import { Lock, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import CinemaPlayer from "../components/cinema-player/CinemaPlayer";
import ChannelLogo, { type Channel } from "../components/media/ChannelLogo";
import AccessGate from "../components/access/AccessGate";
import { canAccessChannel, channelAccessLevel, getPlan, requiredPlanName, upgradeCtaLabel, useTitle } from "../helpers";
import { selectActiveProfile, selectAutoplayEnabled, useAppSelector } from "../store/store";
import channelsData from "../data/channels.json";

// yayin akisi listesi
const CHANNELS: Channel[] = channelsData;

export default function TvPage() {
  useTitle("TV İzle");
  const navigate = useNavigate();
  const userPlan = useAppSelector((s) => s.auth.currentUser?.plan);
  const autoplayEnabled = useAppSelector(selectAutoplayEnabled);
  const isKids = useAppSelector(selectActiveProfile)?.kids ?? false;
  const plan = getPlan(userPlan);
  const availableChannels = useMemo(
    () => isKids ? CHANNELS.filter((channel) => channel.category === "Çocuk") : CHANNELS,
    [isKids],
  );
  const [selected, setSelected] = useState<Channel>(() => availableChannels[0]);
  const [lockedChannel, setLockedChannel] = useState<Channel | null>(null);
  const selectedChannel = availableChannels.some((channel) => channel.id === selected.id)
    ? selected
    : availableChannels[0];
  const visibleLockedChannel = lockedChannel &&
      availableChannels.some((channel) => channel.id === lockedChannel.id)
    ? lockedChannel
    : null;
  const lockedChannelIndex = visibleLockedChannel
    ? CHANNELS.findIndex((channel) => channel.id === visibleLockedChannel.id)
    : -1;
  const lockedChannelLevel = channelAccessLevel(
    Math.max(0, lockedChannelIndex),
    visibleLockedChannel?.category,
  );
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    const matches = availableChannels.map((channel) => ({
      channel,
      no: CHANNELS.findIndex((item) => item.id === channel.id) + 1,
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
  }, [availableChannels, query]);

  const hasResults = groups.length > 0;

  const switchChannel = (direction: -1 | 1) => {
    const currentIndex = availableChannels.findIndex((channel) => channel.id === selectedChannel.id);
    const nextIndex = (currentIndex + direction + availableChannels.length) % availableChannels.length;
    const nextChannel = availableChannels[nextIndex];
    const accessIndex = CHANNELS.findIndex((channel) => channel.id === nextChannel.id);
    if (!canAccessChannel(userPlan, accessIndex, nextChannel.category)) {
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
                    className={`tv-channel-item${selectedChannel.id === channel.id && !visibleLockedChannel ? " active" : ""}${canAccessChannel(userPlan, no - 1, channel.category) ? "" : " is-locked"}`}
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
          <CinemaPlayer
            key={selectedChannel.id}
            src={selectedChannel.url}
            streamType="hls"
            mode="live"
            title={selectedChannel.name}
            eyebrow={selectedChannel.category}
            startMuted
            autoplay={autoplayEnabled}
            className="tv-featured__player"
            maxVideoHeight={plan.capabilities.maxVideoHeight}
            qualityLabel={plan.quality}
            onPrevious={() => switchChannel(-1)}
            onNext={() => switchChannel(1)}
          />
          {visibleLockedChannel && (
            <AccessGate
              className="tv-access-gate"
              role="status"
              icon={<span className="tv-access-gate__icon" aria-hidden="true"><Lock size={26} /></span>}
              title={visibleLockedChannel.name}
              description={`Bu kanal ${requiredPlanName(lockedChannelLevel)} paketine dahildir.`}
              primaryLabel={upgradeCtaLabel(lockedChannelLevel)}
              secondaryLabel="Yayına Dön"
              onPrimary={() => navigate("/packages")}
              onSecondary={() => setLockedChannel(null)}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
