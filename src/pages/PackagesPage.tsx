import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "rsuite";
import { Check } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import { animate } from "animejs";
import PageLayout from "../components/PageLayout";
import { useToast } from "../components/Toast";
import { tmdbApi, getImageUrl } from "../services/tmdb";
import { useFetch, PACKAGES, useTitle, withPoster } from "../helpers";
import { useAppSelector } from "../store/store";
import type { PackageDef } from "../types/types";

export default function PackagesPage() {
  useTitle("Paketler");
  const navigate = useNavigate();
  const toast = useToast();
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // redux
  const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser);
  const currentPlan = useAppSelector((s) => s.auth.currentUser?.plan);

  const { data } = useFetch(() =>
    Promise.all([tmdbApi.getPopularMovies(), tmdbApi.getTopRatedMovies()]),
  );

  // posterlar
  const posters = useMemo(() => {
    if (!data) return [];
    return withPoster([...data[0].results, ...data[1].results])
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

    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll(".package-card");
      animate(cards, {
        opacity: [0, 1],
        translateY: [32, 0],
        duration: 480,
        easing: "easeOutQuart",
        delay: (_el: Element, i: number) => 160 + i * 100,
      });
    }
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

      <div className="packages-grid" ref={gridRef}>
        {PACKAGES.map((pkg) => {
          const isActive = currentPlan === pkg.id;
          const specs = [
            { label: "Görüntü", value: pkg.quality },
            { label: "Eş zamanlı", value: pkg.screens },
            { label: "İndirme", value: pkg.downloads },
            { label: "Destek", value: pkg.support },
          ].filter((s) => s.value);

          return (
            <div
              key={pkg.id}
              className={`package-card${isActive ? " package-card--active" : ""}`}
              style={{ opacity: 0 }}
            >
              <div className="package-card__top">
                <div className="package-card__header">
                  <MotionIcon
                    name={pkg.icon}
                    size={20}
                    className="package-icon"
                    trigger="hover"
                    animation="pop"
                  />
                  <h3 className="package-name">{pkg.name}</h3>
                </div>
                {isActive ? (
                  <span className="package-badge package-badge--active">
                    Mevcut Plan
                  </span>
                ) : (
                  pkg.badge && <span className="package-badge">{pkg.badge}</span>
                )}
              </div>

              {pkg.summary && <p className="package-summary">{pkg.summary}</p>}

              <div className="package-price-row">
                <span className="package-price">{pkg.price}</span>
                {pkg.period && (
                  <span className="package-period">{pkg.period}</span>
                )}
              </div>

              {specs.length > 0 && (
                <dl className="package-specs">
                  {specs.map((s) => (
                    <div className="package-spec" key={s.label}>
                      <dt>{s.label}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <ul className="package-features">
                {pkg.features.map((f) => (
                  <li key={f}>
                    <Check size={15} />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                appearance="primary"
                className={`package-cta package-cta--accent${isActive ? " package-cta--active" : ""}`}
                onClick={() => !isActive && handleSelect(pkg)}
                disabled={isActive}
                block
              >
                {isActive ? "Aktif Planın" : pkg.cta}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="packages-footnote">
        Tüm planlar aylık olarak otomatik yenilenir; dilediğin zaman hesabından
        planını değiştirebilir veya aboneliğini iptal edebilirsin. Fiyatlara KDV
        dahildir.
      </p>
    </PageLayout>
  );
}
