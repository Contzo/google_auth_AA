// app/lib/bundlerClient.ts
// Singleton bundler client — submits signed UserOperations to Alchemy's bundler.
import { createBundlerClient } from "viem/account-abstraction";
import { http } from "viem";
import { sepolia } from "viem/chains";
import { env } from "./env";
import { type PackedUserOperation } from "./generatePackedUserOperation";

export const bundlerClient = createBundlerClient({
  chain: sepolia,
  transport: http(env("rpcUrl")),
});

// ERC-4337 v0.7 packed UserOperation as expected by the bundler JSON-RPC.
// viem's RpcUserOperation type targets v0.6 (unpacked), so we define v0.7 explicitly.
type RpcPackedUserOperation = {
  sender: `0x${string}`;
  nonce: `0x${string}`;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  accountGasLimits: `0x${string}`;
  preVerificationGas: `0x${string}`;
  gasFees: `0x${string}`;
  paymasterAndData: `0x${string}`;
  signature: `0x${string}`;
};

// Serializes bigint fields to hex strings for the JSON-RPC call.
function serializeUserOp(userOp: PackedUserOperation): RpcPackedUserOperation {
  return {
    sender: userOp.sender,
    nonce: `0x${userOp.nonce.toString(16)}`,
    initCode: userOp.initCode,
    callData: userOp.callData,
    accountGasLimits: userOp.accountGasLimits,
    preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
    gasFees: userOp.gasFees,
    paymasterAndData: userOp.paymasterAndData,
    signature: userOp.signature,
  };
}

/// Submits an already-signed PackedUserOperation to the bundler.
/// Use generateSignedUserOperation() to build the userOp before calling this.
export async function sendUserOperation(
  userOp: PackedUserOperation,
): Promise<`0x${string}`> {
  const entryPointAddress = env("entryPoint") as `0x${string}`;
  const response = await fetch(env("rpcUrl"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendUserOperation",
      params: [serializeUserOp(userOp), entryPointAddress],
    }),
  });
  const json = await response.json();
  if (json.error) throw new Error(json.error.message);
  return json.result as `0x${string}`;
}

/// Polls the bundler until the UserOperation is included in a block.
export async function waitForUserOperation(
  userOpHash: `0x${string}`,
): Promise<{ txHash: `0x${string}`; success: boolean }> {
  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });
  return {
    txHash: receipt.receipt.transactionHash,
    success: receipt.success,
  };
}
