"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "@/components/icons";

/* ============================================================
   AddressChip — copyable monospace address pill.
   Client component because copying touches the clipboard.
   ============================================================ */

interface AddressChipProps {
  /** already-shortened label to display, e.g. "0x7F3a…9C21" */
  label: string;
  /** full address to copy; defaults to the label */
  value?: string;
}

export function AddressChip({ label, value }: AddressChipProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value ?? label);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="group inline-flex items-center gap-1.5 rounded-md border border-line bg-sunken px-2 py-1 font-mono text-[11.5px] text-muted transition-colors hover:text-ink"
    >
      {label}
      {copied ? (
        <CheckIcon size={12} className="text-accent" />
      ) : (
        <CopyIcon size={12} className="text-dim transition-colors group-hover:text-accent" />
      )}
    </button>
  );
}
