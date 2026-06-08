import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { isAddress } from "viem";
import { authOptions } from "../../auth/[...nextauth]/route";
import { transferTokens } from "../../../controllers/wallet.controller";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.subId || !session?.user?.scwAddress) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const receiver = searchParams.get("receiver");
  const amount = searchParams.get("amount");

  if (!receiver || !isAddress(receiver)) {
    return NextResponse.json({ error: "Invalid or missing receiver address." }, { status: 400 });
  }
  if (!amount) {
    return NextResponse.json({ error: "Missing amount." }, { status: 400 });
  }

  try {
    const result = await transferTokens(
      session.user.subId as string,
      session.user.scwAddress as string,
      receiver,
      BigInt(amount),
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error("[POST /api/wallet/transfer] Error:", e);
    return NextResponse.json({ error: (e as Error).message ?? "Failed to transfer tokens." }, { status: 500 });
  }
}
