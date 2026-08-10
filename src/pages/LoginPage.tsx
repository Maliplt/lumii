import { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Schema, Button } from "rsuite";
import AuthLayout from "../components/auth/AuthLayout";
import AuthCard from "../components/auth/AuthCard";
import FormField from "../components/auth/FormField";
import PasswordField from "../components/auth/PasswordField";
import AuthErrorBanner from "../components/auth/AuthErrorBanner";
import { toastText, useTitle, useRotatingBackdrop, useAuthRedirectOnSuccess } from "../helpers";
import { emailRule, passwordRule, runSchemaCheck } from "../lib/authValidation";
import { tmdbApi } from "../services/tmdb";
import { useAppDispatch, useAppSelector, login, clearAuthError } from "../store/store";

const loginModel = Schema.Model({
  email: emailRule(),
  password: passwordRule("Lütfen şifrenizi girin."),
});

export default function LoginPage() {
  useTitle("Giriş Yap");
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const authError = useAppSelector((s) => s.auth.error);

  const [formValue, setFormValue] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgotMsg, setForgotMsg] = useState("");
  const submitted = useRef(false);
  const { movies, bgIdx } = useRotatingBackdrop(() => tmdbApi.getPopularMovies());

  useAuthRedirectOnSuccess(currentUser, submitted, toastText.welcome);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleLogin = () => {
    const errs = runSchemaCheck(loginModel, formValue);
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
    setForgotMsg(`Sıfırlama bağlantısı ${formValue.email} adresine gönderildi.`);
  };

  return (
    <AuthLayout movies={movies} activeIndex={bgIdx}>
      <AuthCard
        title="Giriş Yap"
        subtitle="Hesabınıza giriş yapın ve izlemeye devam edin."
      >
        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <FormField
            id="login-email"
            label="E-posta"
            type="email"
            placeholder="ornek@mail.com"
            value={formValue.email}
            onChange={setField("email")}
            error={errors.email}
          />

          <PasswordField
            id="login-password"
            label="Şifre"
            placeholder="••••••••"
            value={formValue.password}
            onChange={setField("password")}
            error={errors.password}
          />

          <button type="button" className="login-forgot" onClick={handleForgot}>
            Şifremi unuttum
          </button>
          {forgotMsg && <p className="login-forgot-msg">{forgotMsg}</p>}

          <AuthErrorBanner message={authError} />

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
              onClick={() => navigate("/register", { state: location.state })}
            >
              Üye Olmak İstiyorum
            </Button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
