import { Scw } from "../lib/scw";
import { scwFactory } from "../lib/viemClient";
import { generateMintUserOperation, generateTransferUserOperation } from "../lib/generatePackedUserOperation";
import { sendUserOperation, waitForUserOperation } from "../lib/bundlerClient";
import { env } from "../lib/env";
import { Address } from "viem";

const TokenAddress = env("erc20Token") as Address;
const Paymaster = env("sponsorContract") as Address;

export async function getBalance(scwAddress: string): Promise<{ balance: string }> {
  const scw = new Scw(scwAddress as Address);
  const balance = await scw.getBalance(TokenAddress);
  return { balance: balance.toString() };
}

export async function mintTokens(
  subId: string,
  amount: bigint,
): Promise<{ txHash: `0x${string}`; success: boolean }> {
  const scwAddress = await scwFactory.predictScwAddress(subId);
  if (!scwAddress) throw new Error("Failed to predict SCW address.");

  const deployed = await scwFactory.getScwAddressFromChain(subId);
  if (!deployed) {
    const newAddress = await scwFactory.deployScw(subId);
    if (!newAddress) throw new Error("Failed to deploy SCW.");
  }

  const userOp = await generateMintUserOperation(TokenAddress, scwAddress, amount, Paymaster);
  if (!userOp) throw new Error("Failed to generate UserOp.");

  const userOpHash = await sendUserOperation(userOp);
  return waitForUserOperation(userOpHash);
}

export async function transferTokens(
  subId: string,
  scwAddress: string,
  receiver: Address,
  amount: bigint,
): Promise<{ txHash: `0x${string}`; success: boolean }> {
  const deployed = await scwFactory.getScwAddressFromChain(subId);
  if (!deployed) throw new Error("SCW not deployed. Mint some tokens first to deploy your wallet.");

  const userOp = await generateTransferUserOperation(
    TokenAddress,
    scwAddress as Address,
    receiver,
    amount,
    Paymaster,
  );
  if (!userOp) throw new Error("Failed to generate UserOp.");

  const userOpHash = await sendUserOperation(userOp);
  return waitForUserOperation(userOpHash);
}
