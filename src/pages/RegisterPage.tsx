import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Schema, Button } from "rsuite";
import AuthLayout from "../components/auth/AuthLayout";
import AuthCard from "../components/auth/AuthCard";
import FormField from "../components/auth/FormField";
import PasswordField from "../components/auth/PasswordField";
import AuthCredentialsFields from "../components/auth/AuthCredentialsFields";
import AuthErrorBanner from "../components/auth/AuthErrorBanner";
import { useAuthForm } from "../components/auth/useAuthForm";
import { toastText, useTitle, useRotatingBackdrop, useAuthRedirectOnSuccess } from "../helpers";
import { emailRule, passwordRule, runSchemaCheck } from "../lib/authValidation";
import { tmdbApi } from "../services/tmdb";
import { useAppDispatch, useAppSelector, register } from "../store/store";

const { StringType } = Schema.Types;

const registerModel = Schema.Model({
  name: StringType().isRequired("Lütfen adınızı girin."),
  email: emailRule(),
  password: passwordRule("Lütfen bir şifre belirleyin."),
  confirm: StringType()
    .addRule((value, data) => value === data.password, "Şifreler eşleşmiyor.")
    .isRequired("Lütfen şifrenizi tekrar girin."),
});

export default function RegisterPage() {
  useTitle("Üye Ol");
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const { formValue, errors, authError, setErrors, updateField } = useAuthForm({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const submitted = useRef(false);
  const { movies, bgIdx } = useRotatingBackdrop(() => tmdbApi.getPopularMovies());

  useAuthRedirectOnSuccess(currentUser, submitted, toastText.registered);

  const handleRegister = () => {
    const errs = runSchemaCheck(registerModel, formValue);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    submitted.current = true;
    dispatch(
      register({
        name: formValue.name.trim(),
        email: formValue.email.trim(),
        password: formValue.password,
      }),
    );
  };

  const setField = (key: keyof typeof formValue) => (value: string) => {
    updateField(key, value);
  };

  return (
    <AuthLayout movies={movies} activeIndex={bgIdx}>
      <AuthCard title="Üye Ol" subtitle="Hesabını oluştur ve izlemeye hemen başla.">
        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
        >
          <FormField
            id="reg-name"
            label="Ad"
            placeholder="Adınız"
            value={formValue.name}
            onChange={setField("name")}
            error={errors.name}
          />

          <AuthCredentialsFields
            idPrefix="reg"
            email={formValue.email}
            password={formValue.password}
            emailError={errors.email}
            passwordError={errors.password}
            passwordPlaceholder="En az 8 karakter"
            onEmailChange={setField("email")}
            onPasswordChange={setField("password")}
          />

          <PasswordField
            id="reg-confirm"
            label="Şifre Tekrar"
            placeholder="••••••••"
            value={formValue.confirm}
            onChange={setField("confirm")}
            error={errors.confirm}
          />

          <AuthErrorBanner message={authError} />

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
              onClick={() => navigate("/login", { state: location.state })}
            >
              Zaten Hesabım Var
            </Button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
