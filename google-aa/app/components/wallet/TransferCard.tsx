"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SendIcon } from "@/components/icons";
import { TOKEN_SYMBOL, TOKEN_DECIMALS, toWei } from "@/lib/format";

interface TransferCardProps {
  balanceWei?: string;
}

async function postTransfer({ receiver, amount }: { receiver: string; amount: string }) {
  const res = await fetch(
    `/api/wallet/transfer?receiver=${receiver}&amount=${toWei(amount)}`,
    { method: "POST" },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to transfer tokens.");
  return data;
}

export default function TransferCard({ balanceWei }: TransferCardProps) {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: postTransfer,
  });

  function handleTransfer() {
    if (!receiver || !amount) return;
    mutate({ receiver, amount });
  }

  function handleMax() {
    if (!balanceWei) return;
    setAmount(formatUnits(BigInt(balanceWei), TOKEN_DECIMALS));
    reset();
  }

  return (
    <Card>
      <CardHeader title="Send Tokens" subtitle="Transfer NXS to any address." />
      <CardBody className="space-y-3 pt-4">
        <Field
          label="Recipient address"
          type="text"
          placeholder="0x0000…0000"
          mono
          value={receiver}
          onChange={(e) => { reset(); setReceiver(e.target.value); }}
          disabled={isPending}
        />

        <Field
          label="Amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          suffix={TOKEN_SYMBOL}
          mono
          value={amount}
          onChange={(e) => { reset(); setAmount(e.target.value); }}
          disabled={isPending}
          trailing={
            <button
              type="button"
              onClick={handleMax}
              disabled={!balanceWei || isPending}
              className="shrink-0 rounded-md border border-line px-2 py-1 font-mono text-[10.5px] uppercase tracking-wide text-muted transition-colors hover:text-ink disabled:opacity-40"
            >
              Max
            </button>
          }
        />

        <Button
          variant="secondary"
          icon={<SendIcon size={15} />}
          pending={isPending}
          onClick={handleTransfer}
        >
          {isPending ? "Sending…" : "Send"}
        </Button>

        {isSuccess && (
          <StatusMessage kind="success">
            Sent {amount} {TOKEN_SYMBOL} to {receiver.slice(0, 6)}…{receiver.slice(-4)}.
          </StatusMessage>
        )}

        {isError && (
          <StatusMessage kind="error">
            {(error as Error).message}
          </StatusMessage>
        )}
      </CardBody>
    </Card>
  );
}
