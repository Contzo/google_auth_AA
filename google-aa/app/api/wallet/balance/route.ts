// app/api/wallet/balance/route.ts
// -> /api/wallet/balance
// Get the token balance of the authenticated user's SCW.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Scw } from "../../../lib/scw";
import { env } from "../../../lib/env";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.scwAddress) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const scwAddress = session.user.scwAddress as `0x${string}`;
    const scw = new Scw(scwAddress);
    const balance = await scw.getBalance(env("erc20Token") as `0x${string}`);
    return NextResponse.json({ balance: balance.toString() });
  } catch (e) {
    console.error("[GET /api/wallet/balance] Error:", e);
    return NextResponse.json({ error: "Failed to fetch balance." }, { status: 500 });
  }
}
