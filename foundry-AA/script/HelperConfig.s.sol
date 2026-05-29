// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {EntryPoint} from "account-abstraction/core/EntryPoint.sol";

struct NetworkConfig {
    address entryPoint;
    address authorizedDeployer;
    address authorizedSigner;
    uint256 signerKey;
}

contract HelperConfig is Script {
    /*//////////////////////////////////////////////////////////////
                                Constants
    //////////////////////////////////////////////////////////////*/

    uint256 constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 constant LOCAL_CHAIN_ID = 31337;

    // Fallback defaults — used when env vars are not set
    address constant DEFAULT_ANVIL_WALLET = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    uint256 constant DEFAULT_ANVIL_SIGNER_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    /*//////////////////////////////////////////////////////////////
                            State variables
    //////////////////////////////////////////////////////////////*/

    mapping(uint256 chainId => NetworkConfig networkConfig) public networkConfigs;

    /*//////////////////////////////////////////////////////////////
                               Functions
    //////////////////////////////////////////////////////////////*/

    constructor() {
        networkConfigs[SEPOLIA_CHAIN_ID] = getSepoliaChainConfig();
    }

    /*//////////////////////////////////////////////////////////////
                           Public functions
    //////////////////////////////////////////////////////////////*/

    function getSepoliaChainConfig() public view returns (NetworkConfig memory) {
        address sepoliaWallet = vm.envAddress("SEPOLIA_WALLET");
        return NetworkConfig({
            entryPoint: vm.envAddress("SEPOLIA_ENTRY_POINT"),
            authorizedDeployer: vm.envOr("SEPOLIA_AUTHORIZED_DEPLOYER", sepoliaWallet),
            authorizedSigner: vm.envOr("SEPOLIA_AUTHORIZED_SIGNER", sepoliaWallet),
            signerKey: vm.envOr("SEPOLIA_SIGNER_KEY", uint256(0))
        });
    }

    function getOrCreateAnvilEthConfig() public returns (NetworkConfig memory) {
        if (networkConfigs[LOCAL_CHAIN_ID].entryPoint != address(0)) {
            return networkConfigs[LOCAL_CHAIN_ID];
        }

        address localWallet = vm.envOr("LOCAL_WALLET", DEFAULT_ANVIL_WALLET);

        vm.startBroadcast(localWallet);
        EntryPoint entryPoint = new EntryPoint();
        vm.stopBroadcast();

        uint256 localSignerKey = vm.envOr("LOCAL_SIGNER_KEY", DEFAULT_ANVIL_SIGNER_KEY);

        NetworkConfig memory anvilConfig = NetworkConfig({
            entryPoint: address(entryPoint),
            authorizedDeployer: localWallet,
            authorizedSigner: localWallet,
            signerKey: localSignerKey
        });

        networkConfigs[LOCAL_CHAIN_ID] = anvilConfig;
        return anvilConfig;
    }

    function getConfigByChainId(uint256 chainId) public returns (NetworkConfig memory) {
        if (chainId == LOCAL_CHAIN_ID) return getOrCreateAnvilEthConfig();
        if (networkConfigs[chainId].entryPoint == address(0)) revert("HelperConfig: chain not supported");
        return networkConfigs[chainId];
    }

    function getCurrentChainConfig() public returns (NetworkConfig memory) {
        return getConfigByChainId(block.chainid);
    }
}
