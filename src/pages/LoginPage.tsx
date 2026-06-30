import { useRef, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Schema, Input, InputGroup, Button } from "rsuite";
import { AlertCircle } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import { animate } from "animejs";
import Header from "../components/header/Header";
import Footer from "../components/Footer";
import { useToast, toastText } from "../components/Toast";
import { useFetch, useTitle } from "../helpers";
import { tmdbApi, getImageUrl } from "../services/tmdb";
import {
  useAppDispatch,
  useAppSelector,
  login,
  clearAuthError,
} from "../store/store";

const { StringType } = Schema.Types;

type CheckResult = Record<string, { hasError: boolean; errorMessage: string }>;

const loginModel = Schema.Model({
  email: StringType()
    .isEmail("Lütfen geçerli bir e-posta adresi girin.")
    .isRequired("Lütfen e-posta adresinizi girin."),
  password: StringType()
    .minLength(8, "Şifreniz en az 8 karakter olmalıdır.")
    .isRequired("Lütfen şifrenizi girin."),
});

export default function LoginPage() {
  useTitle("Giriş Yap");
  const navigate = useNavigate();
  // redux
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const authError = useAppSelector((s) => s.auth.error);
  const cardRef = useRef<HTMLDivElement>(null);

  const [formValue, setFormValue] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const toast = useToast();
  const submitted = useRef(false);
  const [bgIdx, setBgIdx] = useState(0);
  const { data } = useFetch(() => tmdbApi.getPopularMovies());

  const movies = useMemo(
    () =>
      (data?.results ?? [])
        .filter((movie) => movie.backdrop_path && movie.overview)
        .slice(0, 8),
    [data],
  );

  useEffect(() => {
    if (movies.length <= 1) return;
    const id = window.setInterval(
      () => setBgIdx((index) => (index + 1) % movies.length),
      5000,
    );
    return () => window.clearInterval(id);
  }, [movies.length]);

  const currentMovie = movies[bgIdx] ?? null;

  // profil secimi
  useEffect(() => {
    if (currentUser) {
      if (submitted.current) toast(toastText.welcome(currentUser.name));
      navigate("/profiles");
    }
  }, [currentUser, navigate, toast]);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (cardRef.current)
      animate(cardRef.current, {
        opacity: [0, 1],
        translateY: [28, 0],
        duration: 600,
        easing: "easeOutQuart",
      });
  }, []);

  const handleLogin = () => {
    const result = loginModel.check(formValue) as CheckResult;
    const errs: Record<string, string> = {};

    Object.entries(result).forEach(([field, check]) => {
      if (check.hasError) errs[field] = check.errorMessage;
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    submitted.current = true;
    dispatch(login({ ...formValue, email: formValue.email.trim() }));
  };

  const setField = (key: keyof typeof formValue) => (value: string) => {
    setFormValue((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
    if (authError) dispatch(clearAuthError());
    if (forgotMsg) setForgotMsg("");
  };

  const handleForgot = () => {
    if (!formValue.email.includes("@")) {
      setForgotMsg("Lütfen önce e-posta adresinizi girin.");
      return;
    }
    setForgotMsg(
      `Sıfırlama bağlantısı ${formValue.email} adresine gönderildi.`,
    );
  };

  return (
    <div className="login-page">
      <Header />

      {movies.map((movie, index) => (
        <img
          key={movie.id}
          className={`login-bg ${index === bgIdx ? "login-bg--active" : ""}`}
          src={getImageUrl(movie.backdrop_path, "original")}
          alt=""
          aria-hidden="true"
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

        <div className="login-formwrap">
          <div className="login-card" ref={cardRef}>
            <div className="login-card__head">
              <h1 className="login-card__title">Giriş Yap</h1>
              <p className="login-card__subtitle">
                Hesabınıza giriş yapın ve izlemeye devam edin.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <div className="login-field">
                <label className="login-field__label" htmlFor="login-email">
                  E-posta
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="ornek@mail.com"
                  value={formValue.email}
                  onChange={setField("email")}
                />
                {errors.email && (
                  <span className="login-field__error">
                    <AlertCircle size={13} /> {errors.email}
                  </span>
                )}
              </div>

              <div className="login-field">
                <label className="login-field__label" htmlFor="login-password">
                  Şifre
                </label>
                <InputGroup inside>
                  <Input
                    id="login-password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={formValue.password}
                    onChange={setField("password")}
                  />
                  <InputGroup.Button
                    onClick={() => setShowPw((p) => !p)}
                    aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
                  >
                    {showPw ? (
                      <MotionIcon
                        name="EyeOff"
                        size={18}
                        trigger="hover"
                        animation="pop"
                      />
                    ) : (
                      <MotionIcon
                        name="Eye"
                        size={18}
                        trigger="hover"
                        animation="pop"
                      />
                    )}
                  </InputGroup.Button>
                </InputGroup>
                {errors.password && (
                  <span className="login-field__error">
                    <AlertCircle size={13} /> {errors.password}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="login-forgot"
                onClick={handleForgot}
              >
                Şifremi unuttum
              </button>
              {forgotMsg && <p className="login-forgot-msg">{forgotMsg}</p>}

              {authError && (
                <span className="login-field__error login-form__error">
                  <AlertCircle size={14} /> {authError}
                </span>
              )}

              <div className="login-actions">
                <Button
                  appearance="primary"
                  type="submit"
                  block
                  className="login-submit"
                >
                  Giriş Yap
                </Button>
                <Button
                  appearance="ghost"
                  block
                  className="login-register"
                  onClick={() => navigate("/register")}
                >
                  Üye Olmak İstiyorum
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
