"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast as sonnerToast } from "sonner";

export default function HomeToastHandler() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const error = searchParams?.get("error");
    if (error === "notfound") {
      sonnerToast.error("Usuario não registrado. Favor fazer o registro.");
      // Remove the error param from the URL so the toast only shows once
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState(
        {},
        document.title,
        url.pathname + url.search
      );
    }
  }, [searchParams]);
  return null;
}
