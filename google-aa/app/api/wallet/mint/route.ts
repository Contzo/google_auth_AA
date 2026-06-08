import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { generateMintUserOperation } from "../../../lib/generatePackedUserOperation";
import { sendUserOperation, waitForUserOperation } from "../../../lib/bundlerClient";
import { env } from "../../../lib/env";
import { scwFactory } from "../../../lib/viemClient";
import { Address } from "viem";

const TokenAddress = env("erc20Token") as Address;
const Paymaster = env("sponsorContract") as Address;

export async function POST(request: NextRequest) {
  // Only authenticated users can mint to their own SCW.
  const session = await getServerSession(authOptions);
  if (!session?.user?.subId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const amount = searchParams.get("amount");
  if (!amount) {
    return NextResponse.json({ error: "Can't mint zero tokens." }, { status: 400 });
  }

  try {
    const subId = session.user.subId;

    // Derive the deterministic SCW address for this user.
    const scwAddress = await scwFactory.predictScwAddress(subId);
    if (!scwAddress) {
      return NextResponse.json({ error: "Failed to predict SCW address." }, { status: 500 });
    }

    // Deploy the SCW if it doesn't exist yet.
    // factory.deployScw() requires the server's authorized deployer key,
    // so this can't go in initCode — we do it as a separate tx first.
    const deployedAddress = await scwFactory.getScwAddressFromChain(subId);
    if (!deployedAddress) {
      const newScwAddress = await scwFactory.deployScw(subId);
      if (!newScwAddress) {
        return NextResponse.json({ error: "Failed to deploy SCW." }, { status: 500 });
      }
    }

    // SCW is now deployed — build and submit the UserOp.
    // The SCW calls token.mint(scwAddress, amount) via its own execute().
    const userOp = await generateMintUserOperation(
      TokenAddress,
      scwAddress,
      BigInt(amount),
      Paymaster,
    );
    if (!userOp) {
      return NextResponse.json({ error: "Failed to generate userOp." }, { status: 500 });
    }

    const userOpHash = await sendUserOperation(userOp);
    const { txHash, success } = await waitForUserOperation(userOpHash);
    return NextResponse.json({ txHash, success });
  } catch (e) {
    console.error("[POST /api/wallet/mint] Error:", e);
    return NextResponse.json({ error: "Failed to mint tokens." }, { status: 500 });
  }
}
