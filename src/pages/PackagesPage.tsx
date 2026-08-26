import { useMemo, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import PackageCard from "../components/catalog/PackageCard";
import { tmdbApi, getImageUrl } from "../services/tmdb";
import { effectivePlanId, useFetch, PACKAGES, useTitle, withPoster, settleList } from "../helpers";
import { useAppSelector } from "../store/store";
import type { PackageDef } from "../types/types";
import OptimizedImage from "../components/ui/OptimizedImage";

export default function PackagesPage() {
  useTitle("Paketler");
  const navigate = useNavigate();

  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const currentPlan = currentUser ? effectivePlanId(currentUser.plan) : undefined;

  const { data } = useFetch(
    () =>
      settleList([
        tmdbApi.getPopularMovies(),
        tmdbApi.getTopRatedMovies(),
        tmdbApi.getPopularTVShows(),
        tmdbApi.getTopRatedTVShows(),
      ]),
    "package-posters",
    "enhancement",
  );

  // posterlar
  const posters = useMemo(() => {
    if (!data) return [];
    return withPoster([
      ...(data[0]?.results ?? []),
      ...(data[1]?.results ?? []),
      ...(data[2]?.results ?? []),
      ...(data[3]?.results ?? []),
    ])
      .slice(0, 48)
      .map((m) => getImageUrl(m.poster_path, "w300"));
  }, [data]);

  // secim
  const handleSelect = (pkg: PackageDef) => {
    if (pkg.free) {
      navigate("/register");
      return;
    }
    navigate(`/checkout/${pkg.id}`);
  };

  return (
    <PageLayout className="packages-page" mainClassName="packages-main">
      <div className="packages-backdrop" aria-hidden="true">
        <div className="packages-backdrop__grid">
          {posters.map((src, i) => (
            <OptimizedImage
              key={`${src}-${i}`}
              src={src}
              alt=""
              priority={i < 6}
              style={{ "--poster-index": i } as CSSProperties}
            />
          ))}
        </div>
        <div className="packages-backdrop__veil" />
      </div>

      <div className="packages-hero">
        <span className="packages-badge">Planlar &amp; Fiyatlar</span>
        <h1 className="packages-hero__title">
          Binlerce Film, Dizi ve Oyun Seni Bekliyor
        </h1>
        <p className="packages-hero__subtitle">
          Ücretsiz seçkiden Full HD deneyimine uzanan paketler. İhtiyacına uygun
          planı seç, istediğin zaman değiştir.
        </p>
      </div>

      <div className="packages-grid">
        {PACKAGES.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            isActive={currentPlan === pkg.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <p className="packages-footnote">
        Tüm planlar aylık olarak otomatik yenilenir; dilediğin zaman hesabından
        planını değiştirebilir veya aboneliğini iptal edebilirsin. Fiyatlara KDV
        dahildir.
      </p>
    </PageLayout>
  );
}
