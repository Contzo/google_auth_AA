// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {ScwToken} from "../src/ScwToken.sol";

contract MintScwToken is Script {
    function run() public {
        address tokenAddress = vm.envAddress("TOKEN_ADDRESS");
        address localWallet = vm.envAddress("LOCAL_WALLET");
        address recipient = vm.envOr("RECIPIENT", localWallet);
        uint256 amount = vm.envUint("AMOUNT");
        address minter = vm.envOr("MINTER", localWallet);

        vm.startBroadcast(minter);
        ScwToken(tokenAddress).mint(recipient, amount);
        vm.stopBroadcast();
    }
}
