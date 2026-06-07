import { ScwTokenAbi } from "./abi/ScwToken";
import { walletClient } from "./viemClient";

export class Scw {
  private scwAddress: `0x${string}`;

  constructor(scwAddress: `0x${string}`) {
    this.scwAddress = scwAddress;
  }

  async getBalance(tokenAddress: `0x${string}`): Promise<bigint> {
    const balance = await walletClient.readContract({
      address: tokenAddress,
      abi: ScwTokenAbi,
      functionName: "balanceOf",
      args: [this.scwAddress],
    });
    return balance as bigint;
  }
}
