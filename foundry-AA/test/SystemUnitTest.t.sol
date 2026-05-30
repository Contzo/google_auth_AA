// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SCW} from "../src/SCW.sol";
import {ScwFactory} from "../src/ScwFactory.sol";
import {ScwToken} from "../src/ScwToken.sol";
import {SponsorContract} from "../src/SponsorContract.sol";
import {HelperConfig, NetworkConfig} from "../script/HelperConfig.s.sol";
import {SystemDeployer} from "../script/SystemDeployer.s.sol";
import {SendPackedUserOp} from "../script/SendPackedUserOp.s.sol";
import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

using MessageHashUtils for bytes32;

contract SystemUnitTest is Test {
    HelperConfig private helperConfig;
    NetworkConfig private networkConfig;
    SystemDeployer private systemDeployer;
    ScwFactory private scwFactory;
    ScwToken private scwToken;
    SponsorContract private sponsorContract;
    SendPackedUserOp private sendPackedUserOp;

    uint256 constant AMOUNT = 1e18; // standard amount of USDC to mint
    address private randomUser = makeAddr("randomUser");

    bytes32 private constant CODE_HASH_USER_1 = keccak256("USER_1");
    bytes32 private constant CODE_HASH_USER_2 = keccak256("USER_2");

    function setUp() public {
        helperConfig = new HelperConfig();
        networkConfig = helperConfig.getCurrentChainConfig();
        sendPackedUserOp = new SendPackedUserOp();
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

    /// @notice test that will check if the authorized sigenr can be recovered from a UserOperation object
    /// that will mint some SCW tokens to a SCW address
    function test_CanRecoverSigner() public view {
        // ── Arrange ──────────────────────────────
        // Deploy SCW contract
        address scwAddress = scwFactory.predictScwAddress(CODE_HASH_USER_1);

        bytes memory functionDataForMint = abi.encodeWithSelector(ScwToken.mint.selector, scwAddress, AMOUNT);

        bytes memory functionDataForExecute =
            abi.encodeWithSelector(SCW.execute.selector, address(scwToken), 0, functionDataForMint);

        PackedUserOperation memory userOp =
            sendPackedUserOp.generateSignedUserOp(scwAddress, functionDataForExecute, networkConfig, address(0));
        bytes32 userOpHash = IEntryPoint(networkConfig.entryPoint).getUserOpHash(userOp);

        // ── Act ──────────────────────────────────
        bytes32 digest = userOpHash.toEthSignedMessageHash();
        address signer = ECDSA.recover(digest, userOp.signature);

        // ── Assert ──────────────────────────────────
        assertEq(signer, networkConfig.authorizedSigner, "Signer recvery failed");
    }

    /// @notice test that will check if the authorized sigenr can be recovered from a UserOperation object
    function test_ValidateUserOp() public {
        // ── Arrange ──────────────────────────────
        // Deploy SCW contract
        vm.prank(networkConfig.authorizedDeployer);
        address scwAddress = scwFactory.deployScw(CODE_HASH_USER_1);

        address dest = address(scwToken);
        uint256 value = 0;

        bytes memory functionData = abi.encodeWithSelector(scwToken.mint.selector, scwAddress, AMOUNT);

        bytes memory callData = abi.encodeWithSelector(SCW.execute.selector, dest, value, functionData);

        PackedUserOperation memory userOp =
            sendPackedUserOp.generateSignedUserOp(scwAddress, callData, networkConfig, address(0));

        bytes32 userOpHash = IEntryPoint(networkConfig.entryPoint).getUserOpHash(userOp);
        uint256 missingFunds = 1e18;
        vm.deal(scwAddress, missingFunds);

        // ── Act ──────────────────────────────────
        vm.prank(networkConfig.entryPoint);
        uint256 validationData = SCW(payable(scwAddress)).validateUserOp(userOp, userOpHash, missingFunds);

        // ── Assert ──────────────────────────────────
        // Check that the validationData is equal to the expected value of 0
        assertEq(validationData, 0);
    }

    function test_EntryPointFlow() public {
        // ── Arrange ──────────────────────────────
        vm.prank(networkConfig.authorizedDeployer);
        address scwAddress = scwFactory.deployScw(CODE_HASH_USER_1);
        vm.deal(scwAddress, AMOUNT);

        address dest = address(scwToken);
        uint256 value = 0;

        bytes memory functionData = abi.encodeWithSelector(scwToken.mint.selector, scwAddress, AMOUNT);
        bytes memory callData = abi.encodeWithSelector(SCW.execute.selector, dest, value, functionData);
        PackedUserOperation memory userOp =
            sendPackedUserOp.generateSignedUserOp(scwAddress, callData, networkConfig, address(0));
        // Construct the array of usre ops
        PackedUserOperation[] memory userOps = new PackedUserOperation[](1);
        userOps[0] = userOp;

        // random user accting like bundler from the mempool
        // two-arg prank sets both msg.sender and tx.origin — required by this EntryPoint's nonReentrant modifier
        vm.prank(randomUser, randomUser);
        IEntryPoint(networkConfig.entryPoint).handleOps(userOps, payable(randomUser));

        // ── Assert ──────────────────────────────────
        // Check that the SCW hasUSDC
        assertEq(scwToken.balanceOf(address(scwAddress)), AMOUNT);
    }

    /// @notice test that will check if the sponsor contract will not validate only SCW contracts that are not deployed by the sponsor contract
    function test_SponsorContractDoesNotValidateInvalidScwContracts() public {
        // ── Arrange ──────────────────────────────
        // Deploy SCW contract outside of the factory
        SCW invalidScwAddress = new SCW(networkConfig.entryPoint, networkConfig.authorizedSigner, address(scwToken));

        // Build the userOp
        address dest = address(scwToken);
        uint256 value = 0;

        bytes memory functionData = abi.encodeWithSelector(scwToken.mint.selector, address(invalidScwAddress), AMOUNT); // mint to invalidScwAddress
        bytes memory callData = abi.encodeWithSelector(SCW.execute.selector, dest, value, functionData);
        PackedUserOperation memory userOp = sendPackedUserOp.generateSignedUserOp(
            address(invalidScwAddress), callData, networkConfig, address(sponsorContract)
        );
        bytes32 userOpHash = IEntryPoint(networkConfig.entryPoint).getUserOpHash(userOp);

        // ── Act ──────────────────────────────────
        // Send the paymaster valdiation call ass the EntryPoint     // ── 1. Generate the unsigned PackedUserOperation data
        vm.prank(networkConfig.entryPoint);
        (, uint256 validationData) = sponsorContract.validatePaymasterUserOp(userOp, userOpHash, 0);
        // ── Assert ──────────────────────────────────
        assertEq(
            validationData,
            1,
            "Sponsor contract should not validate SCW contracts that are not deployed by the sponsor contract"
        );
    }

    /// @notice test that will check if the sponsor contract can validate a SCW contract deployed by the factory
    function test_SponsorContractCanValidateSCWContractsDeployedByFactory() public {
        // ── Arrange ──────────────────────────────
        // Deploy SCW contract outside of the factory
        vm.prank(networkConfig.authorizedDeployer);
        address validScwAddress = scwFactory.deployScw(CODE_HASH_USER_1);

        // Build the userOp
        address dest = address(scwToken);
        uint256 value = 0;

        bytes memory functionData = abi.encodeWithSelector(scwToken.mint.selector, validScwAddress, AMOUNT);
        bytes memory callData = abi.encodeWithSelector(SCW.execute.selector, dest, value, functionData);
        PackedUserOperation memory userOp =
            sendPackedUserOp.generateSignedUserOp(validScwAddress, callData, networkConfig, address(sponsorContract));
        bytes32 userOpHash = IEntryPoint(networkConfig.entryPoint).getUserOpHash(userOp);

        // ── Act ──────────────────────────────────
        // Send the paymaster valdiation call ass the EntryPoint     // ── 1. Generate the unsigned PackedUserOperation data
        vm.prank(networkConfig.entryPoint);
        (, uint256 validationData) = sponsorContract.validatePaymasterUserOp(userOp, userOpHash, 0);
        // ── Assert ──────────────────────────────────
        assertEq(validationData, 0, "Sponsor contract should validate SCW contracts that are deployed by the factory");
    }
}

