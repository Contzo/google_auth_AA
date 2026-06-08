import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { mintTokens } from "../../../controllers/wallet.controller";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.subId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const amount = new URL(request.url).searchParams.get("amount");
  if (!amount) {
    return NextResponse.json({ error: "Can't mint zero tokens." }, { status: 400 });
  }

  try {
    const result = await mintTokens(session.user.subId as string, BigInt(amount));
    return NextResponse.json(result);
  } catch (e) {
    console.error("[POST /api/wallet/mint] Error:", e);
    return NextResponse.json({ error: "Failed to mint tokens." }, { status: 500 });
  }
}
