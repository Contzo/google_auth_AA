"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { PlusIcon } from "@/components/icons";
import { TOKEN_SYMBOL, toWei } from "@/lib/format";

async function postMint(amount: string) {
  const res = await fetch(`/api/wallet/mint?amount=${toWei(amount)}`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to mint tokens.");
  return data;
}

export default function MintCard() {
  const [amount, setAmount] = useState("");

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: postMint,
  });

  function handleMint() {
    if (!amount) return;
    mutate(amount);
  }

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
          value={amount}
          onChange={(e) => {
            reset();
            setAmount(e.target.value);
          }}
          disabled={isPending}
        />

        <Button icon={<PlusIcon size={16} />} pending={isPending} onClick={handleMint}>
          {isPending ? "Minting…" : "Mint"}
        </Button>

        {isSuccess && (
          <StatusMessage kind="success">
            Minted {amount} {TOKEN_SYMBOL} successfully.
          </StatusMessage>
        )}

        {isError && (
          <StatusMessage kind="error">
            {(error as Error).message}
          </StatusMessage>
        )}

        {!isPending && !isSuccess && !isError && (
          <p className="flex items-center gap-1.5 text-[12px] text-dim">
            <span className="h-1 w-1 rounded-full bg-accentdim" />
            Gas sponsored by the Nexus paymaster.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
