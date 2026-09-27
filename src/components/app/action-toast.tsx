"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useModalClose } from "@/components/ui/modal";

export function ActionToast({ pendingMessage, successMessage }: { pendingMessage: string; successMessage: string }) {
  const { pending } = useFormStatus();
  const closeModal = useModalClose();
  const toastId = useRef<string | number | undefined>(undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      toastId.current = toast.loading(pendingMessage);
      return;
    }

    if (wasPending.current && toastId.current !== undefined) {
      toast.success(successMessage, { id: toastId.current });
      closeModal?.();
      toastId.current = undefined;
      wasPending.current = false;
    }
  }, [closeModal, pending, pendingMessage, successMessage]);

  return null;
}
