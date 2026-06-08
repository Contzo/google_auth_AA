// app/lib/bundlerClient.ts
// Singleton bundler client — submits signed UserOperations to Alchemy's bundler.
import { createBundlerClient } from "viem/account-abstraction";
import { http } from "viem";
import { sepolia } from "viem/chains";
import { env } from "./env";
import { walletClient } from "./viemClient";
import { type PackedUserOperation } from "./generatePackedUserOperation";

export const bundlerClient = createBundlerClient({
  chain: sepolia,
  transport: http(env("rpcUrl")),
});

// ERC-4337 v0.7 UserOperation as expected by the bundler JSON-RPC (unpacked form).
// The on-chain struct packs gas limits and paymaster fields into bytes32/bytes,
// but the bundler RPC wants them as separate named fields.
type RpcUserOperationV07 = {
  sender: `0x${string}`;
  nonce: `0x${string}`;
  factory?: `0x${string}`;
  factoryData?: `0x${string}`;
  callData: `0x${string}`;
  verificationGasLimit: `0x${string}`;
  callGasLimit: `0x${string}`;
  preVerificationGas: `0x${string}`;
  maxFeePerGas: `0x${string}`;
  maxPriorityFeePerGas: `0x${string}`;
  paymaster?: `0x${string}`;
  paymasterVerificationGasLimit?: `0x${string}`;
  paymasterPostOpGasLimit?: `0x${string}`;
  paymasterData?: `0x${string}`;
  signature: `0x${string}`;
};

function toHex(n: bigint): `0x${string}` {
  return `0x${n.toString(16)}` as `0x${string}`;
}

// bytes32 packed as hi(16 bytes) ++ lo(16 bytes) → two bigints.
function unpackBytes32(packed: `0x${string}`): { hi: bigint; lo: bigint } {
  const hex = packed.slice(2).padStart(64, "0");
  return {
    hi: BigInt(`0x${hex.slice(0, 32)}`),
    lo: BigInt(`0x${hex.slice(32)}`),
  };
}

// Converts the on-chain PackedUserOperation into the bundler JSON-RPC shape.
function serializeUserOp(userOp: PackedUserOperation): RpcUserOperationV07 {
  const { hi: verificationGasLimit, lo: callGasLimit } = unpackBytes32(userOp.accountGasLimits);
  const { hi: maxPriorityFeePerGas, lo: maxFeePerGas } = unpackBytes32(userOp.gasFees);

  const rpc: RpcUserOperationV07 = {
    sender: userOp.sender,
    nonce: toHex(userOp.nonce),
    callData: userOp.callData,
    verificationGasLimit: toHex(verificationGasLimit),
    callGasLimit: toHex(callGasLimit),
    preVerificationGas: toHex(userOp.preVerificationGas),
    maxFeePerGas: toHex(maxFeePerGas),
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas),
    signature: userOp.signature,
  };

  // initCode = factory(20 bytes) ++ factoryData(rest)
  if (userOp.initCode && userOp.initCode !== "0x") {
    rpc.factory = `0x${userOp.initCode.slice(2, 42)}` as `0x${string}`;
    rpc.factoryData = `0x${userOp.initCode.slice(42)}` as `0x${string}`;
  }

  // paymasterAndData = paymaster(20) ++ verificationGasLimit(16) ++ postOpGasLimit(16) ++ data
  const pmHex = (userOp.paymasterAndData as string).slice(2);
  if (pmHex.length >= 104) {
    rpc.paymaster = `0x${pmHex.slice(0, 40)}` as `0x${string}`;
    rpc.paymasterVerificationGasLimit = toHex(BigInt(`0x${pmHex.slice(40, 72)}`));
    rpc.paymasterPostOpGasLimit = toHex(BigInt(`0x${pmHex.slice(72, 104)}`));
    if (pmHex.length > 104) {
      rpc.paymasterData = `0x${pmHex.slice(104)}` as `0x${string}`;
    }
  }

  return rpc;
}

async function bundlerRpc(method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(env("rpcUrl"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await response.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

type GasEstimate = {
  preVerificationGas: bigint;
  verificationGasLimit: bigint;
  callGasLimit: bigint;
  paymasterVerificationGasLimit: bigint;
  paymasterPostOpGasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
};

/// Calls eth_estimateUserOperationGas + rundler_maxPriorityFeePerGas to get
/// accurate gas values for a UserOp before signing and sending.
export async function estimateUserOperationGas(
  userOp: PackedUserOperation,
): Promise<GasEstimate> {
  const entryPointAddress = env("entryPoint") as `0x${string}`;

  const [gasEstimate, priorityFeeHex, networkFees] = await Promise.all([
    bundlerRpc("eth_estimateUserOperationGas", [serializeUserOp(userOp), entryPointAddress]),
    bundlerRpc("rundler_maxPriorityFeePerGas", []),
    walletClient.estimateFeesPerGas(),
  ]);

  const g = gasEstimate as Record<string, string>;

  // Use the higher of the bundler's required priority fee and the network estimate.
  const bundlerPriorityFee = BigInt(priorityFeeHex as string);
  const maxPriorityFeePerGas = networkFees.maxPriorityFeePerGas != null && networkFees.maxPriorityFeePerGas > bundlerPriorityFee
    ? networkFees.maxPriorityFeePerGas
    : bundlerPriorityFee;

  // Use the network maxFeePerGas (baseFee * 2 + priorityFee) — ensures it covers the current base fee.
  const maxFeePerGas = networkFees.maxFeePerGas > maxPriorityFeePerGas
    ? networkFees.maxFeePerGas
    : maxPriorityFeePerGas;

  return {
    preVerificationGas: BigInt(g.preVerificationGas),
    verificationGasLimit: BigInt(g.verificationGasLimit),
    callGasLimit: BigInt(g.callGasLimit),
    paymasterVerificationGasLimit: BigInt(g.paymasterVerificationGasLimit ?? g.verificationGasLimit),
    paymasterPostOpGasLimit: BigInt(g.paymasterPostOpGasLimit ?? "0x0"),
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
}

/// Submits an already-signed PackedUserOperation to the bundler.
/// Use generateSignedUserOperation() to build the userOp before calling this.
export async function sendUserOperation(
  userOp: PackedUserOperation,
): Promise<`0x${string}`> {
  const entryPointAddress = env("entryPoint") as `0x${string}`;
  return bundlerRpc("eth_sendUserOperation", [serializeUserOp(userOp), entryPointAddress]) as Promise<`0x${string}`>;
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
