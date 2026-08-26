import type { ReactNode } from "react";
import Header from "../header/Header";
import Footer from "../layout/Footer";
import { getImageUrl } from "../../services/tmdb";
import type { Movie } from "../../types/types";
import OptimizedImage from "../ui/OptimizedImage";

interface AuthLayoutProps {
  movies: Movie[];
  activeIndex: number;
  children: ReactNode;
}

export default function AuthLayout({ movies, activeIndex, children }: AuthLayoutProps) {
  const currentMovie = movies[activeIndex] ?? null;

  return (
    <div className="login-page">
      <Header />

      {movies.map((movie, index) => (
        <OptimizedImage
          key={movie.id}
          className={`login-bg ${index === activeIndex ? "login-bg--active" : ""}`}
          src={getImageUrl(movie.backdrop_path, "original")}
          alt=""
          aria-hidden="true"
          priority={index === activeIndex}
        />
      ))}
      <div className="login-bg__overlay" />

      <div className="login-body">
        <div className="login-intro">
          {currentMovie && (
            <div className="login-intro__inner">
              <span className="login-intro__badge">Günün Filmi</span>
              <h2 className="login-intro__title">{currentMovie.title}</h2>
              <p className="login-intro__desc">{currentMovie.overview}</p>
            </div>
          )}
        </div>

        <div className="login-formwrap">{children}</div>
      </div>

      <Footer />
    </div>
  );
}
