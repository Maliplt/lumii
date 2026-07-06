import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { animate } from "animejs";
import PageLayout from "../components/PageLayout";
import PackageCard from "../components/PackageCard";
import { tmdbApi, getImageUrl } from "../services/tmdb";
import { useFetch, PACKAGES, useTitle, withPoster, settleList, useToast } from "../helpers";
import { useAppSelector } from "../store/store";
import type { PackageDef } from "../types/types";

export default function PackagesPage() {
  useTitle("Paketler");
  const navigate = useNavigate();
  const toast = useToast();
  const heroRef = useRef<HTMLDivElement>(null);

  // redux
  const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser);
  const currentPlan = useAppSelector((s) => s.auth.currentUser?.plan);

  const { data } = useFetch(() =>
    settleList([tmdbApi.getPopularMovies(), tmdbApi.getTopRatedMovies()]),
  );

  // posterlar
  const posters = useMemo(() => {
    if (!data) return [];
    return withPoster([
      ...(data[0]?.results ?? []),
      ...(data[1]?.results ?? []),
    ])
      .slice(0, 30)
      .map((m) => getImageUrl(m.poster_path, "w300"));
  }, [data]);

  useEffect(() => {
    if (heroRef.current)
      animate(heroRef.current, {
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 500,
        easing: "easeOutQuart",
      });
  }, []);

  // secim
  const handleSelect = (pkg: PackageDef) => {
    if (pkg.free) {
      navigate("/register");
      return;
    }
    if (!isLoggedIn) {
      toast("Paket satın almak için önce giriş yapmalısın.", "warning");
      navigate("/login");
      return;
    }
    navigate(`/checkout/${pkg.id}`);
  };

  return (
    <PageLayout className="packages-page" mainClassName="packages-main">
      <div className="packages-backdrop" aria-hidden="true">
        <div className="packages-backdrop__grid">
          {posters.map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" />
          ))}
        </div>
        <div className="packages-backdrop__veil" />
      </div>

      <div className="packages-hero" ref={heroRef} style={{ opacity: 0 }}>
        <span className="packages-badge">Planlar &amp; Fiyatlar</span>
        <h1 className="packages-hero__title">
          Binlerce Film, Dizi ve Oyun Seni Bekliyor
        </h1>
        <p className="packages-hero__subtitle">
          Reklamsız, 4K kalitede, sınırsız erişim. Ücretsiz başla, istediğin
          zaman yükselt.
        </p>
      </div>

      <div className="packages-grid">
        {PACKAGES.map((pkg, i) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            isActive={currentPlan === pkg.id}
            index={i}
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
