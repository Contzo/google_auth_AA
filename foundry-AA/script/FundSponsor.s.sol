// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {DevOpsTools} from "foundry-devops/src/DevOpsTools.sol";
import {HelperConfig, NetworkConfig} from "./HelperConfig.s.sol";
import {ISponsorContract} from "../src/interfaces/ISponsorContract.sol";

contract FundSponsor is Script {
    HelperConfig helperConfig;
    NetworkConfig networkConfig;

    function run() public {
        helperConfig = new HelperConfig();
        networkConfig = helperConfig.getCurrentChainConfig();

        address sponsorAddress = DevOpsTools.get_most_recent_deployment("SponsorContract", block.chainid);

        vm.startBroadcast(networkConfig.authorizedDeployer);
        ISponsorContract(sponsorAddress).deposit{value: 0.1 ether}();
        vm.stopBroadcast();
    }
}
