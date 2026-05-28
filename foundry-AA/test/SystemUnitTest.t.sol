// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SCW} from "../src/SCW.sol";
import {ScwFactory} from "../src/ScwFactory.sol";
import {ScwToken} from "../src/ScwToken.sol";
import {SponsorContract} from "../src/SponsorContract.sol";
import {HelperConfig, NetworkConfig} from "../script/HelperConfig.s.sol";
import {SystemDeployer} from "../script/SystemDeployer.s.sol";

contract SystemUnitTest is Test {
    HelperConfig private helperConfig;
    NetworkConfig private networkConfig;
    SystemDeployer private systemDeployer;
    ScwFactory private scwFactory;
    ScwToken private scwToken;
    SponsorContract private sponsorContract;

    bytes32 private constant CODE_HASH_USER_1 = keccak256("USER_1");
    bytes32 private constant CODE_HASH_USER_2 = keccak256("USER_2");
    address private randomUser = makeAddr("randomUser");

    function setUp() public {
        helperConfig = new HelperConfig();
        networkConfig = helperConfig.getCurrentChainConfig();
        systemDeployer = new SystemDeployer();
        vm.startPrank(networkConfig.authorizedDeployer);
        (scwFactory, scwToken, sponsorContract) = systemDeployer.deploySystem(networkConfig);
        vm.stopPrank();
    }

    function test_DeploySCWOnlyByAuthorizedDeployer() public {
        // ── Arrange ──────────────────────────────

        // ── Act ──────────────────────────────────
        vm.expectRevert(ScwFactory.ScwFactory__NotAuthorizedDeployer.selector);
        vm.prank(randomUser);
        scwFactory.deployScw(CODE_HASH_USER_1);
        // ── Assert ──────────────────────────────────
    }

    function test_DeploySCWByAuthorizedDeployer() public {
        // ── Arrange ──────────────────────────────
        address predictedScwAddress = scwFactory.predictScwAddress(CODE_HASH_USER_1);

        // ── Act ──────────────────────────────────
        vm.prank(networkConfig.authorizedDeployer);
        address deployedScwAddress = scwFactory.deployScw(CODE_HASH_USER_1);
        // ── Assert ──────────────────────────────────
        assertEq(deployedScwAddress, predictedScwAddress, "Deployed SCW address differs from predicted address");
    }

    function test_PredictedAddressesAreUnique() public view {
        // ── Arrange ──────────────────────────────
        address predictedScwAddress1 = scwFactory.predictScwAddress(CODE_HASH_USER_1);
        address predictedScwAddress2 = scwFactory.predictScwAddress(CODE_HASH_USER_2);

        // ── Assert ───────────────────────
        assertNotEq(predictedScwAddress1, predictedScwAddress2, "Predicted SCW addresses are not unique");
    }
}
