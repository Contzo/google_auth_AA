import { NextResponse, NextRequest } from "next/server";
import { generateMintUserOperation } from "../../../lib/generatePackedUserOperation";
import { sendUserOperation, waitForUserOperation } from "../../../lib/bundlerClient";
import { env } from "../../../lib/env";
import { Address, isAddress } from "viem";

const TokenAddress = env("erc20Token") as Address;
const Paymaster = env("sponsorContract") as Address;

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recipient = searchParams.get("recipient");
  const amount = searchParams.get("amount");

  if (!recipient || isAddress(recipient) === false) {
    return NextResponse.json({ error: "Invalid recipient." }, { status: 400 });
  }
  if (!amount) {
    return NextResponse.json(
      { error: "Can't mint zero tokens." },
      { status: 400 },
    );
  }
  const amountBigInt = BigInt(amount);
  try {
    const userOp = await generateMintUserOperation(
      TokenAddress,
      recipient as Address,
      amountBigInt,
      Paymaster,
    );
    if (!userOp) {
      return NextResponse.json(
        { error: "Failed to generate userOp." },
        { status: 500 },
      );
    }
    const userOpHash = await sendUserOperation(userOp);
    const { txHash, success } = await waitForUserOperation(userOpHash);
    return NextResponse.json({ txHash, success });
  } catch (e) {
    console.error("[POST /api/wallet/mint] Error:", e);
    return NextResponse.json(
      { error: "Failed to mint tokens." },
      { status: 500 },
    );
  }
}
