import {
  isAddress,
  Address,
  Hex,
  encodeFunctionData,
  encodePacked,
  zeroAddress,
} from "viem";
import { walletClient, entryContract } from "./viemClient";
import { estimateUserOperationGas } from "./bundlerClient";
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
  initCode: `0x${string}`,
  callData: `0x${string}`,
  paymaster: Address,
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint,
): PackedUserOperation {
  if (!isAddress(sender)) {
    throw new Error("Invalid sender address");
  }
  if (!isAddress(paymaster)) {
    throw new Error("Invalid paymasterAndData address");
  }

  const verificationGasLimit = BigInt(150_000);
  const callGasLimit = BigInt(100_000);
  const accountGasLimits = packGas(verificationGasLimit, callGasLimit);
  const gasFees = packGas(maxPriorityFeePerGas, maxFeePerGas);

  const paymsterVerificationGasLimit = BigInt(100_000);
  const paymasterPostOpGasLimit = BigInt(50_000);
  const paymasterAndData = encodePaymasterAndData(
    paymaster,
    paymsterVerificationGasLimit,
    paymasterPostOpGasLimit,
  );

  return {
    sender,
    nonce,
    initCode,
    callData,
    accountGasLimits,
    preVerificationGas: BigInt(50_000),
    gasFees,
    paymasterAndData,
    signature: `0x`,
  };
}

export async function generateSignedUserOperation(
  sender: Address,
  callData: `0x${string}`,
  paymasterAndData: `0x${string}`,
  initCode: `0x${string}` = `0x`,
): Promise<PackedUserOperation | null> {
  try {
    const nonce = await entryContract.getNonce(sender);
    if (nonce === null) {
      throw new Error("Failed to fetch nonce");
    }

    // Pass 1 — sign the draft (gas = 0) so ECDSA.recover doesn't revert during estimation.
    // A dummy 0xff...ff signature causes OpenZeppelin's ECDSA to throw ECDSAInvalidSignatureS
    // (s > secp256k1 half-order), which bubbles up as AA23. A real signature for the
    // draft hash is valid ECDSA, recovers to sUserOperationSigner, and lets estimation proceed.
    const draftUserOp = generatePackedUserOperation(
      sender,
      nonce,
      initCode,
      callData,
      paymasterAndData,
      BigInt(0),
      BigInt(0),
    );
    const draftHash = await entryContract.getUserOpHash(draftUserOp);
    if (!draftHash) throw new Error("Failed to fetch draft userOpHash");
    draftUserOp.signature = await walletClient.signMessage({ message: { raw: draftHash as Hex } });

    // Pass 2 — estimate gas using the signed draft.
    const gas = await estimateUserOperationGas(draftUserOp);
    // Alchemy's estimator adds a ~6x buffer to verificationGasLimit, but its bundler
    // rejects UserOps where actualGasUsed/limit < 0.4. Dividing by 3 targets ~0.48
    // efficiency (actual ≈ 16% of estimate → limit = estimate/3 → efficiency ≈ 0.49).
    const verificationGasLimit = gas.verificationGasLimit / BigInt(3);
    const paymasterVerificationGasLimit = gas.paymasterVerificationGasLimit / BigInt(3);
    draftUserOp.accountGasLimits = packGas(verificationGasLimit, gas.callGasLimit);
    draftUserOp.preVerificationGas = gas.preVerificationGas;
    draftUserOp.gasFees = packGas(gas.maxPriorityFeePerGas, gas.maxFeePerGas);
    if (draftUserOp.paymasterAndData !== "0x") {
      const pmHex = (draftUserOp.paymasterAndData as string).slice(2);
      const paymaster = `0x${pmHex.slice(0, 40)}` as Address;
      draftUserOp.paymasterAndData = encodePaymasterAndData(
        paymaster,
        paymasterVerificationGasLimit,
        gas.paymasterPostOpGasLimit,
      );
    }

    // Gas fields changed the hash — sign once more with the final values.
    const finalHash = await entryContract.getUserOpHash(draftUserOp);
    if (!finalHash) throw new Error("Failed to fetch final userOpHash");
    draftUserOp.signature = await walletClient.signMessage({ message: { raw: finalHash as Hex } });
    return draftUserOp;
  } catch (e) {
    console.error("[generateSignedUserOperation] Error:", e);
    return null;
  }
}

export async function generateMintUserOperation(
  tokenAddress: Address,
  scwAddress: Address,
  amount: bigint,
  paymaster: Address,
): Promise<PackedUserOperation | null> {
  try {
    const mintCallData = encodeFunctionData({
      abi: ScwTokenAbi,
      functionName: "mint",
      args: [scwAddress, amount],
    });
    const executeCallData = encodeFunctionData({
      abi: ScwAbi,
      functionName: "execute",
      args: [tokenAddress, BigInt(0), mintCallData],
    });
    return await generateSignedUserOperation(
      scwAddress,
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
  senderScwAddress: Address,
  recipient: Address,
  amount: bigint,
  paymaster: Address,
): Promise<PackedUserOperation | null> {
  try {
    const transferCallData = encodeFunctionData({
      abi: ScwTokenAbi,
      functionName: "transfer",
      args: [recipient, amount],
    });
    const executeCallData = encodeFunctionData({
      abi: ScwAbi,
      functionName: "execute",
      args: [tokenAddress, BigInt(0), transferCallData],
    });
    return await generateSignedUserOperation(
      senderScwAddress,
      executeCallData,
      paymaster,
    );
  } catch (e) {
    console.error("[generateTransferUserOperation] Error:", e);
    return null;
  }
}
