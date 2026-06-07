// app/api/wallet/balance/route.ts
// Get the balance of the connected wallet.
import { NextResponse, NextRequest } from "next/server";
import { Scw } from "../../../lib/scw";
import { env } from "../../../lib/env";
import { entryContract } from "../../../lib/viemClient";
import { Address, isAddress } from "viem";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scwAddress = searchParams.get("scwAddress");

  if (!scwAddress) {
    return NextResponse.json(
      { error: "Missing scwAddress parameter." },
      { status: 400 },
    );
  }

  if (!isAddress(scwAddress)) {
    return NextResponse.json({ error: "Invalid scwAddress." }, { status: 400 });
  }
  try {
    const scw = new Scw(scwAddress as `0x${string}`);
    console.log(`[GET /api/wallet/balance] Fetching balance for ${scwAddress}`);
    console.log("ERC20 token address:", env("erc20Token"));
    const balance = await scw.getBalance(env("erc20Token") as `0x${string}`);
    const nonce = await entryContract.getNonce(scwAddress as Address);
    console.log(`[GET /api/wallet/balance] Nonce: ${nonce}`);
    return NextResponse.json({ balance: balance.toString() });
  } catch (e) {
    console.error("[GET /api/wallet/balance] Error:", e);
    return NextResponse.json(
      { error: "Failed to fetch balance." },
      { status: 500 },
    );
  }
}
