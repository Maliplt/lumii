import { useCallback, useEffect, useState } from "react";
import { clearAuthError, useAppDispatch, useAppSelector } from "../../store/store";

type FormValues = Record<string, string>;

export function useAuthForm<T extends FormValues>(initialValue: T) {
  const dispatch = useAppDispatch();
  const authError = useAppSelector((state) => state.auth.error);
  const [formValue, setFormValue] = useState<T>(initialValue);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const updateField = useCallback(
    (key: keyof T, value: string) => {
      setFormValue((current) => ({ ...current, [key]: value }));
      setErrors((current) =>
        current[String(key)]
          ? { ...current, [String(key)]: "" }
          : current,
      );
      if (authError) dispatch(clearAuthError());
    },
    [authError, dispatch],
  );

  return {
    formValue,
    errors,
    authError,
    setErrors,
    updateField,
  };
}
