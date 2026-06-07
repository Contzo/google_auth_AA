import { walletClient } from "./viemClient";
import { isAddress, Address } from "viem";
import { EntryPointAbi } from "./abi/EntryPoint";
import { PackedUserOperation } from "./generatePackedUserOperation";

export class EntryContract {
  private entryPointAddress;

  constructor(entryPointAddress: Address) {
    if (!isAddress(entryPointAddress)) {
      throw new Error("Invalid entryPointAddress");
    }
    this.entryPointAddress = entryPointAddress;
  }

  async getNonce(sender: Address): Promise<bigint | null> {
    try {
      const nonce = await walletClient.readContract({
        address: this.entryPointAddress,
        abi: EntryPointAbi,
        functionName: "getNonce",
        args: [sender, BigInt(0)],
      });
      return nonce as bigint;
    } catch (e) {
      console.error("[getNonce] Error:", e);
      return null;
    }
  }

  async getUserOpHash(
    userOp: PackedUserOperation,
  ): Promise<`0x${string}` | null> {
    try {
      const userOpHash = await walletClient.readContract({
        address: this.entryPointAddress,
        abi: EntryPointAbi,
        functionName: "getUserOpHash",
        args: [userOp],
      });
      return userOpHash as `0x${string}`;
    } catch (e) {
      console.error("[getUserOpHash] Error:", e);
      return null;
    }
  }
}
