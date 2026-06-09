"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshIcon } from "@/components/icons";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => router.refresh())}
      aria-label="Refresh balance"
      className={
        "flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-raised transition-colors hover:text-ink " +
        (isPending ? "text-accent" : "text-muted")
      }
    >
      <RefreshIcon size={15} className={isPending ? "spin" : ""} />
    </button>
  );
}
