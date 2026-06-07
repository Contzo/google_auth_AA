import {
  createWalletClient,
  publicActions,
  http,
  type WalletClient,
  type PublicActions,
  type Account,
  type Chain,
  type Transport,
} from "viem";
import { sepolia, anvil } from "viem/chains";
import { ScwTokenAbi } from "./abi/ScwToken";
import { env, rawEnv, NETWORK } from "./env";
import { privateKeyToAccount } from "viem/accounts";

type ExtendedWalletClient = WalletClient<Transport, Chain, Account> &
  PublicActions;

export class Scw {
  private walletClient: ExtendedWalletClient;
  private scwAddress: `0x${string}`;

  constructor(scwAddress: `0x${string}`) {
    this.scwAddress = scwAddress;
    const account = privateKeyToAccount(env("signerKey") as `0x${string}`);
    console.log("RPC URL:", env("rpcUrl"));
    this.walletClient = createWalletClient({
      account,
      chain: NETWORK === "anvil" ? anvil : sepolia,
      transport: http(env("rpcUrl")),
    }).extend(publicActions) as ExtendedWalletClient;
  }
  async getBalance(tokenAddress: `0x${string}`): Promise<bigint> {
    const balance = await this.walletClient.readContract({
      address: tokenAddress,
      abi: ScwTokenAbi,
      functionName: "balanceOf",
      args: [this.scwAddress],
    });
    return balance as bigint;
  }
}
