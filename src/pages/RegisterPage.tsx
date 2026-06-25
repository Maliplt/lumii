import { useRef, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Schema, Input, InputGroup, Button } from "rsuite";
import { AlertCircle } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import { animate } from "animejs";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast, toastText } from "../components/Toast";
import { useFetch, useTitle } from "../helpers";
import { tmdbApi, getImageUrl } from "../services/tmdb";
import {
  useAppDispatch,
  useAppSelector,
  register,
  clearAuthError,
} from "../store/store";

const { StringType } = Schema.Types;

type CheckResult = Record<string, { hasError: boolean; errorMessage: string }>;

const registerModel = Schema.Model({
  name: StringType().isRequired("Lütfen adınızı girin."),
  email: StringType()
    .isEmail("Lütfen geçerli bir e-posta adresi girin.")
    .isRequired("Lütfen e-posta adresinizi girin."),
  password: StringType()
    .minLength(8, "Şifreniz en az 8 karakter olmalıdır.")
    .isRequired("Lütfen bir şifre belirleyin."),
  confirm: StringType()
    .addRule((value, data) => value === data.password, "Şifreler eşleşmiyor.")
    .isRequired("Lütfen şifrenizi tekrar girin."),
});

export default function RegisterPage() {
  useTitle("Üye Ol");
  const navigate = useNavigate();
  // redux
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const authError = useAppSelector((s) => s.auth.error);
  const cardRef = useRef<HTMLDivElement>(null);

  const [formValue, setFormValue] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
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
      if (submitted.current) toast(toastText.registered(currentUser.name));
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

  const handleRegister = () => {
    const result = registerModel.check(formValue) as CheckResult;
    const errs: Record<string, string> = {};

    Object.entries(result).forEach(([field, check]) => {
      if (check.hasError) errs[field] = check.errorMessage;
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    submitted.current = true;
    dispatch(
      register({
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
      }),
    );
  };

  const setField = (key: keyof typeof formValue) => (value: string) => {
    setFormValue((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
    if (authError) dispatch(clearAuthError());
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
              <h1 className="login-card__title">Üye Ol</h1>
              <p className="login-card__subtitle">
                Hesabını oluştur ve izlemeye hemen başla.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleRegister();
              }}
            >
              <div className="login-field">
                <label className="login-field__label" htmlFor="reg-name">
                  Ad
                </label>
                <Input
                  id="reg-name"
                  placeholder="Adınız"
                  value={formValue.name}
                  onChange={setField("name")}
                />
                {errors.name && (
                  <span className="login-field__error">
                    <AlertCircle size={13} /> {errors.name}
                  </span>
                )}
              </div>

              <div className="login-field">
                <label className="login-field__label" htmlFor="reg-email">
                  E-posta
                </label>
                <Input
                  id="reg-email"
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
                <label className="login-field__label" htmlFor="reg-password">
                  Şifre
                </label>
                <InputGroup inside>
                  <Input
                    id="reg-password"
                    type={showPw ? "text" : "password"}
                    placeholder="En az 8 karakter"
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

              <div className="login-field">
                <label className="login-field__label" htmlFor="reg-confirm">
                  Şifre Tekrar
                </label>
                <InputGroup inside>
                  <Input
                    id="reg-confirm"
                    type={showPw2 ? "text" : "password"}
                    placeholder="••••••••"
                    value={formValue.confirm}
                    onChange={setField("confirm")}
                  />
                  <InputGroup.Button
                    onClick={() => setShowPw2((p) => !p)}
                    aria-label={showPw2 ? "Şifreyi gizle" : "Şifreyi göster"}
                  >
                    <MotionIcon
                      name={showPw2 ? "EyeOff" : "Eye"}
                      size={18}
                      trigger="hover"
                      animation="pop"
                    />
                  </InputGroup.Button>
                </InputGroup>
                {errors.confirm && (
                  <span className="login-field__error">
                    <AlertCircle size={13} /> {errors.confirm}
                  </span>
                )}
              </div>

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
                  Üye Ol
                </Button>
                <Button
                  appearance="ghost"
                  block
                  className="login-register"
                  onClick={() => navigate("/login")}
                >
                  Zaten Hesabım Var
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
