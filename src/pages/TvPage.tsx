import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import PageLayout from "../components/PageLayout";
import MediaPlayer from "../components/MediaPlayer";
import { useTitle } from "../helpers";

interface Channel {
  id: string;
  name: string;
  short: string;
  category: string;
  logo: string;
  url: string;
}

// yalnizca ercdn.net akislari (iptv-org index.m3u) + bir adet beIN
const CHANNELS: Channel[] = [
  {
    id: "atv",
    name: "ATV",
    short: "atv",
    category: "Genel",
    logo: "https://i.imgur.com/HyVUwFC.png",
    url: "https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/atv/atv_1080p.m3u8",
  },
  {
    id: "a2tv",
    name: "A2 TV",
    short: "A2",
    category: "Genel",
    logo: "https://iatv.tmgrup.com.tr/site/v2/a2tv/i/a2tv-logo.png",
    url: "https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/a2tv/a2tv.m3u8",
  },
  {
    id: "ahaber",
    name: "A Haber",
    short: "AH",
    category: "Haber",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Ahaber_Logo.png",
    url: "https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/ahaber/ahaber.m3u8",
  },
  {
    id: "aspor",
    name: "A Spor",
    short: "AS",
    category: "Spor",
    logo: "https://i.imgur.com/ZhkZzLf.png",
    url: "https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8",
  },
  {
    id: "nowtv",
    name: "NOW TV",
    short: "NOW",
    category: "Eğlence",
    logo: "https://i.imgur.com/5EYjWK7.png",
    url: "https://uycyyuuzyh.turknet.ercdn.net/nphindgytw/nowtv/nowtv.m3u8",
  },
  {
    id: "tv360",
    name: "360 TV",
    short: "360",
    category: "Haber",
    logo: "https://i.imgur.com/agn47sQ.png",
    url: "https://turkmedya-live.ercdn.net/tv360/tv360.m3u8",
  },
  {
    id: "tv4",
    name: "TV4",
    short: "TV4",
    category: "Genel",
    logo: "https://i.imgur.com/UpsQsbd.png",
    url: "https://turkmedya-live.ercdn.net/tv4/tv4.m3u8",
  },
  {
    id: "cnbce",
    name: "CNBC-e",
    short: "CNBC",
    category: "Ekonomi",
    logo: "https://s.cnbce.com/dist/images/logo-nav.png",
    url: "https://hnpsechtsc.turknet.ercdn.net/xpnvudnlsv/cnbc-e/cnbc-e.m3u8",
  },
  {
    id: "tele1",
    name: "Tele 1",
    short: "T1",
    category: "Haber",
    logo: "https://upload.wikimedia.org/wikipedia/tr/4/43/Tele1_logosu.png",
    url: "https://tele1-live.ercdn.net/tele1/tele1.m3u8",
  },
  {
    id: "tbmmtv",
    name: "TBMM TV",
    short: "TBMM",
    category: "Haber",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/TBMM_TV_logo.svg/960px-TBMM_TV_logo.svg.png",
    url: "https://meclistv-live.ercdn.net/meclistv/meclistv.m3u8",
  },
  {
    id: "akittv",
    name: "Akit TV",
    short: "AKT",
    category: "Haber",
    logo: "https://i.imgur.com/oGto929.png",
    url: "https://akittv-live.ercdn.net/akittv/akittv.m3u8",
  },
  {
    id: "minikago",
    name: "Minika Go",
    short: "MG",
    category: "Çocuk",
    logo: "https://i.imgur.com/qIoipDq.png",
    url: "https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/minikago/minikago.m3u8",
  },
  {
    id: "minikacocuk",
    name: "Minika Çocuk",
    short: "MÇ",
    category: "Çocuk",
    logo: "https://i.imgur.com/VCywMTv.png",
    url: "https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/minikago_cocuk/minikago_cocuk.m3u8",
  },
  {
    id: "disneyjr",
    name: "Disney Junior",
    short: "DJR",
    category: "Çocuk",
    logo: "https://www.dsmart.com.tr/api/v1/public/images/kanallar/disneyjr.png",
    url: "https://saran-live.ercdn.net/disneyjunior/index.m3u8",
  },
  {
    id: "babytv",
    name: "BabyTV",
    short: "BABY",
    category: "Çocuk",
    logo: "https://i.imgur.com/4BDJ5FT.png",
    url: "https://saran-live.ercdn.net/babytv/index.m3u8",
  },
  {
    id: "fx",
    name: "FX",
    short: "FX",
    category: "Sinema",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/FX_International_logo.svg/960px-FX_International_logo.svg.png",
    url: "https://saran-live.ercdn.net/fx/index.m3u8",
  },
];

// logo yuklenmezse kisa kod fallback
function ChannelLogo({ channel }: { channel: Channel }) {
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
      <img
        src={channel.logo}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export default function TvPage() {
  useTitle("TV İzle");
  const [selected, setSelected] = useState<Channel>(CHANNELS[0]);
  const [query, setQuery] = useState("");

  // sabit kanal numarasi (1..N) + arama filtresi
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return CHANNELS.map((channel, index) => ({ channel, no: index + 1 })).filter(
      ({ channel }) =>
        !q ||
        channel.name.toLocaleLowerCase("tr").includes(q) ||
        channel.category.toLocaleLowerCase("tr").includes(q),
    );
  }, [query]);

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
            {filtered.map(({ channel, no }) => (
              <button
                key={channel.id}
                className={`tv-channel-item${selected.id === channel.id ? " active" : ""}`}
                onClick={() => setSelected(channel)}
              >
                <span className="tv-channel-item__no">{no}</span>
                <ChannelLogo channel={channel} />
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
            {!filtered.length && (
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
