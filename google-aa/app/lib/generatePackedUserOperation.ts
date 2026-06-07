import {
  isAddress,
  Address,
  Hex,
  encodeFunctionData,
  encodePacked,
  zeroAddress,
} from "viem";
import { walletClient, entryContract } from "./viemClient";
import { ScwAbi } from "./abi/Scw";
import { ScwTokenAbi } from "./abi/ScwToken";

export type PackedUserOperation = {
  sender: Address;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  accountGasLimits: `0x${string}`; // bytes32: verificationGasLimit (16 bytes) + callGasLimit (16 bytes)
  preVerificationGas: bigint;
  gasFees: `0x${string}`; // bytes32: maxPriorityFeePerGas (16 bytes) + maxFeePerGas (16 bytes)
  paymasterAndData: Address;
  signature: `0x${string}`;
};

function packGas(hi: bigint, lo: bigint): `0x${string}` {
  return `0x${hi.toString(16).padStart(32, "0")}${lo.toString(16).padStart(32, "0")}` as `0x${string}`;
}

function encodePaymasterAndData(
  paymaster: Address,
  verificationGasLimit: bigint,
  postOpGasLimit: bigint,
): `0x${string}` {
  if (paymaster === zeroAddress) return "0x";

  return encodePacked(
    ["address", "uint128", "uint128"],
    [paymaster, verificationGasLimit, postOpGasLimit],
  );
}
// bytes memory callData, address sender, uint256 nonce, address paymaster)
function generatePackedUserOperation(
  sender: Address,
  nonce: bigint,
  callData: `0x${string}`,
  paymaster: Address,
): PackedUserOperation {
  if (!isAddress(sender)) {
    throw new Error("Invalid sender address");
  }
  if (!isAddress(paymaster)) {
    throw new Error("Invalid paymasterAndData address");
  }

  const verificationGasLimit = BigInt(16777216);
  const callGasLimit = verificationGasLimit;
  const maxPriorityFeePerGas = BigInt(256);
  const maxFeePerGas = maxPriorityFeePerGas;
  const accountGasLimits = packGas(verificationGasLimit, callGasLimit);
  const gasFees = packGas(maxFeePerGas, maxPriorityFeePerGas);

  const paymsterVerificationGasLimit = verificationGasLimit;
  const paymasterPostOpGasLimit = verificationGasLimit;
  const paymasterAndData = encodePaymasterAndData(
    paymaster,
    paymsterVerificationGasLimit,
    paymasterPostOpGasLimit,
  );

  return {
    sender,
    nonce,
    initCode: `0x`,
    callData,
    accountGasLimits,
    preVerificationGas: BigInt(0),
    gasFees,
    paymasterAndData,
    signature: `0x`,
  };
}

export async function generateSignedUserOperation(
  sender: Address,
  callData: `0x${string}`,
  paymasterAndData: `0x${string}`,
): Promise<PackedUserOperation | null> {
  try {
    const nonce = await entryContract.getNonce(sender);
    if (nonce === null) {
      throw new Error("Failed to fetch nonce");
    }
    const userOp = generatePackedUserOperation(
      sender,
      nonce,
      callData,
      paymasterAndData,
    );
    const userOpHash = await entryContract.getUserOpHash(userOp);
    if (!userOpHash) {
      throw new Error("Failed to fetch userOpHash");
    }
    // Pack the userOpHash into the signature
    const signature = await walletClient.signMessage({
      message: { raw: userOpHash as Hex },
    });
    userOp.signature = signature;
    return userOp;
  } catch (e) {
    console.error("[generateSignedUserOperation] Error:", e);
    return null;
  }
}

export async function generateMintUserOperation(
  tokenAddress: Address,
  recipient: Address,
  amount: bigint,
  paymaster: Address,
): Promise<PackedUserOperation | null> {
  try {
    const mintCallData = encodeFunctionData({
      abi: ScwTokenAbi,
      functionName: "mint",
      args: [recipient, amount],
    });
    const executeCallData = encodeFunctionData({
      abi: ScwAbi,
      functionName: "execute",
      args: [tokenAddress, BigInt(0), mintCallData],
    });
    return await generateSignedUserOperation(
      recipient,
      executeCallData,
      paymaster,
    );
  } catch (e) {
    console.error("[generateMintUserOperation] Error:", e);
    return null;
  }
}
export async function generateTransferUserOperation(
  tokenAddress: Address,
  recipient: Address,
  amount: bigint,
  paymaster: Address,
): Promise<PackedUserOperation | null> {
  try {
    const mintCallData = encodeFunctionData({
      abi: ScwTokenAbi,
      functionName: "transfer",
      args: [recipient, amount],
    });
    const executeCallData = encodeFunctionData({
      abi: ScwAbi,
      functionName: "execute",
      args: [tokenAddress, BigInt(0), mintCallData],
    });
    return await generateSignedUserOperation(
      recipient,
      executeCallData,
      paymaster,
    );
  } catch (e) {
    console.error("[generateTransferUserOperation] Error:", e);
    return null;
  }
}
