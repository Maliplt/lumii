import { Schema } from "rsuite";

const { StringType } = Schema.Types;

type CheckResult = Record<string, { hasError: boolean; errorMessage: string }>;

export function emailRule() {
  return StringType()
    .isEmail("Lütfen geçerli bir e-posta adresi girin.")
    .isRequired("Lütfen e-posta adresinizi girin.");
}

export function passwordRule(requiredMessage: string) {
  return StringType()
    .minLength(8, "Şifreniz en az 8 karakter olmalıdır.")
    .isRequired(requiredMessage);
}
// doğrulama kontrolü
export function runSchemaCheck<T>(
  model: { check: (values: T) => unknown },
  values: T,
): Record<string, string> {
  const result = model.check(values) as CheckResult;
  const errors: Record<string, string> = {};
  Object.entries(result).forEach(([field, check]) => {
    if (check.hasError) errors[field] = check.errorMessage;
  });
  return errors;
}
