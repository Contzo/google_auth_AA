"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { PlusIcon } from "@/components/icons";
import { TOKEN_SYMBOL } from "@/lib/format";
import type { AsyncStatus } from "@/lib/types";

/* ============================================================
   MintCard — "Get Tokens".
   On submit (wire it up):
     const wei = toWei(amount);
     await fetch(`/api/wallet/mint?amount=${wei}`, { method: "POST" });
   ============================================================ */

interface MintCardProps {
  status?: AsyncStatus; // placeholder for request lifecycle
  message?: string;
}

export default function MintCard({
  status = "idle", // TODO: drive from POST /api/wallet/mint
  message = "Minted 100 NXS · confirmed in block 8,420,113",
}: MintCardProps) {
  const isLoading = status === "loading";

  return (
    <Card>
      <CardHeader
        title="Get Tokens"
        subtitle="Mint test NXS to your smart account."
      />
      <CardBody className="space-y-3 pt-4">
        <Field
          label="Amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          suffix={TOKEN_SYMBOL}
          mono
          // value={amount} onChange={…}  ← wire controlled input
        />

        <Button icon={<PlusIcon size={16} />} pending={isLoading}>
          {isLoading ? "Minting…" : "Mint"}
        </Button>

        {status === "success" && (
          <StatusMessage kind="success">{message}</StatusMessage>
        )}
        {status === "error" && (
          <StatusMessage kind="error">{message}</StatusMessage>
        )}

        {status === "idle" && (
          <p className="flex items-center gap-1.5 text-[12px] text-dim">
            <span className="h-1 w-1 rounded-full bg-accentdim" />
            Gas sponsored by the Nexus paymaster.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
