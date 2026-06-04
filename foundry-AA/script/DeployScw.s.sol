// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {HelperConfig, NetworkConfig} from "./HelperConfig.s.sol";
import {ScwFactory} from "../src/ScwFactory.sol";
import {DevOpsTools} from "foundry-devops/src/DevOpsTools.sol";

contract DeployScw is Script {
    ScwFactory scwFactory;
    HelperConfig helperConfig;
    NetworkConfig networkConfig;

    function run(bytes32 credentialsHash) public {
        helperConfig = new HelperConfig();
        networkConfig = helperConfig.getCurrentChainConfig();
        address scwFactoryAddress = DevOpsTools.get_most_recent_deployment("ScwFactory", block.chainid);
        scwFactory = ScwFactory(scwFactoryAddress);
        vm.startBroadcast(networkConfig.authorizedDeployer);
        scwFactory.deployScw(credentialsHash);
        vm.stopBroadcast();
    }
}

