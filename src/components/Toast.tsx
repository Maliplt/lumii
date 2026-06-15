import { useCallback } from "react";
import { useToaster, Message } from "rsuite";

type ToastType = "success" | "info" | "warning" | "error";

// bildirim
export function useToast() {
  const toaster = useToaster();

  return useCallback(
    (text: string, type: ToastType = "success") => {
      toaster.push(
        <Message type={type} showIcon closable>
          {text}
        </Message>,
        { placement: "topEnd", duration: 3000 },
      );
    },
    [toaster],
  );
}
