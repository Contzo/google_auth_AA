// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {ScwFactory} from "../src/ScwFactory.sol";
import {ScwToken} from "../src/ScwToken.sol";
import {SponsorContract} from "../src/SponsorContract.sol";
import {HelperConfig, NetworkConfig} from "./HelperConfig.s.sol";

contract SystemDeployer is Script {
    function run() public {
        HelperConfig helperConfig = new HelperConfig();
        NetworkConfig memory networkConfig = helperConfig.getCurrentChainConfig();
        vm.startBroadcast(networkConfig.authorizedDeployer);
        deploySystem(networkConfig);
        vm.stopBroadcast();
    }

    function deploySystem(NetworkConfig memory networkConfig) public returns (ScwFactory, ScwToken, SponsorContract) {
        ScwToken scwToken = new ScwToken();
        ScwFactory scwFactory = new ScwFactory(
            networkConfig.entryPoint,
            address(scwToken),
            networkConfig.authorizedDeployer,
            networkConfig.authorizedSigner
        );
        SponsorContract sponsorContract =
            new SponsorContract(address(scwFactory), networkConfig.authorizedSigner, networkConfig.entryPoint, networkConfig.authorizedDeployer);
        return (scwFactory, scwToken, sponsorContract);
    }
}
