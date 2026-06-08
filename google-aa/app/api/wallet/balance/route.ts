import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getBalance } from "../../../controllers/wallet.controller";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.scwAddress) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const result = await getBalance(session.user.scwAddress as string);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[GET /api/wallet/balance] Error:", e);
    return NextResponse.json({ error: "Failed to fetch balance." }, { status: 500 });
  }
}
