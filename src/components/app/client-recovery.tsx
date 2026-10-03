"use client";

import { useEffect } from "react";

const reloadKey = "the-folio-client-recovery-reloaded";

function errorText(error: unknown) {
  if (error instanceof Error) return `${error.name} ${error.message} ${error.stack ?? ""}`;
  return String(error ?? "");
}

function isRecoverableClientLoadError(error: unknown) {
  const text = errorText(error);
  return /ChunkLoadError|Loading chunk|dynamically imported module|Failed to fetch dynamically imported module|module script/i.test(text);
}

function reloadOnce() {
  if (window.sessionStorage.getItem(reloadKey) === "1") return;
  window.sessionStorage.setItem(reloadKey, "1");
  window.location.reload();
}

export function ClientRecovery() {
  useEffect(() => {
    window.sessionStorage.removeItem(reloadKey);

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    const onError = (event: ErrorEvent) => {
      if (isRecoverableClientLoadError(event.error || event.message)) reloadOnce();
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isRecoverableClientLoadError(event.reason)) reloadOnce();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
