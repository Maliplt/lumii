import { useCallback } from "react";
import { useToaster, Message } from "rsuite";
import { resolveServiceError } from "../services/serviceError";

type ToastType = "success" | "info" | "warning" | "error";

export const toastText = {
  loginForWatchlist: "İzleme listeni kullanmak için önce giriş yapmalısın.",
  loginForLike: "İçerikleri beğenmek için önce giriş yapmalısın.",
  watchlistAdded: "İzleme listesine eklendi.",
  watchlistRemoved: "İzleme listesinden çıkarıldı.",
  liked: "Beğenilen içeriklere eklendi.",
  unliked: "Beğeni geri alındı.",
  profileUpdated: "Profil güncellendi.",
  profileAdded: "Profil eklendi.",
  profileDeleted: "Profil silindi.",
  loggedOut: "Çıkış yapıldı.",
  profileCreated: (name: string) => `${name} profili oluşturuldu.`,
  welcome: (name: string) => `Hoş geldin ${name}!`,
  registered: (name: string) => `Üyeliğin oluşturuldu, hoş geldin ${name}!`,
} as const;

export function useToast() {
  const toaster = useToaster();

  return useCallback(
    (text: string, type: ToastType = "success") => {
      toaster.push(
        <Message type={type} showIcon closable>
          {text}
        </Message>,
        { placement: "topCenter", duration: 3000 },
      );
    },
    [toaster],
  );
}

export function useServiceErrorToast() {
  const toaster = useToaster();

  return useCallback(
    (error: unknown) => {
      const failure = resolveServiceError(error, "action");
      if (failure.surface === "toast") {
        const presentation = failure.presentation;
        toaster.push(
          <Message
            type="error"
            header={presentation.title}
            className="service-error-toast"
            showIcon
            closable
          >
            <span className="service-error-toast__code">
              HTTP {failure.status}
            </span>
            <span className="service-error-toast__message">
              {presentation.message}
            </span>
          </Message>,
          { placement: "topCenter", duration: 5000 },
        );
      }
    },
    [toaster],
  );
}
