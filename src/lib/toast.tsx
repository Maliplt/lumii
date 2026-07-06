import { useCallback } from "react";
import { useToaster, Message } from "rsuite";

type ToastType = "success" | "info" | "warning" | "error";

export const toastText = {
  loginForWatchlist: "İzleme listeni kullanmak için önce giriş yapmalısın.",
  loginForLike: "İçerikleri beğenmek için önce giriş yapmalısın.",
  watchlistAdded: "İzleme listesine eklendi.",
  watchlistRemoved: "İzleme listesinden çıkarıldı.",
  liked: "Beğenildi.",
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
