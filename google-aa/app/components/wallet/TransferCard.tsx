"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SendIcon } from "@/components/icons";
import { TOKEN_SYMBOL } from "@/lib/format";
import type { AsyncStatus } from "@/lib/types";

/* ============================================================
   TransferCard — "Send Tokens".
   On submit (wire it up):
     const wei = toWei(amount);
     await fetch(
       `/api/wallet/transfer?receiver=${receiver}&amount=${wei}`,
       { method: "POST" }
     );
   ============================================================ */

interface TransferCardProps {
  status?: AsyncStatus; // placeholder for request lifecycle
  message?: string;
}

export default function TransferCard({
  status = "idle", // TODO: drive from POST /api/wallet/transfer
  message = "Insufficient balance — you hold 1,250 NXS.",
}: TransferCardProps) {
  const isLoading = status === "loading";

  return (
    <Card>
      <CardHeader title="Send Tokens" subtitle="Transfer NXS to any address." />
      <CardBody className="space-y-3 pt-4">
        <Field
          label="Recipient address"
          type="text"
          placeholder="0x0000…0000"
          mono
          // value={receiver} onChange={…}
        />

        <Field
          label="Amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          suffix={TOKEN_SYMBOL}
          mono
          // value={amount} onChange={…}
          trailing={
            <button
              type="button"
              className="shrink-0 rounded-md border border-line px-2 py-1 font-mono text-[10.5px] uppercase tracking-wide text-muted transition-colors hover:text-ink"
            >
              Max
            </button>
          }
        />

        <Button
          variant="secondary"
          icon={<SendIcon size={15} />}
          pending={isLoading}
        >
          {isLoading ? "Sending…" : "Send"}
        </Button>

        {status === "success" && (
          <StatusMessage kind="success">{message}</StatusMessage>
        )}
        {status === "error" && (
          <StatusMessage kind="error">{message}</StatusMessage>
        )}
      </CardBody>
    </Card>
  );
}
