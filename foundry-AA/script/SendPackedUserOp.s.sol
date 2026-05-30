// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";
import {HelperConfig, NetworkConfig} from "./HelperConfig.s.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

using MessageHashUtils for bytes32;

contract SendPackedUserOp is Script {
    HelperConfig helperConfig;
    // uint256 constant ANVIL_DEFAULT_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // Default Anvil key 0

    function setUp() public {
        helperConfig = new HelperConfig();
    }

    function generateUserOp(bytes memory callData, address sender) public view returns (PackedUserOperation memory) {
        // ── 1. Generate the unsigned PackedUserOperation data
        uint256 nonce = vm.getNonce(sender); // fetch the current nonce of the sender

        PackedUserOperation memory unsignedUserOp = _generateUserOp(callData, sender, nonce, address(0));

        // ── 2. Sign the PackedUserOperation (to implement later)
        return unsignedUserOp; // for now we just return the unsigned userOp
    }

    function _generateUserOp(bytes memory callData, address sender, uint256 nonce, address paymaster)
        internal
        pure
        returns (PackedUserOperation memory)
    {
        // Gas Related parameters
        uint128 verificationGasLimit = 16777216;
        uint128 callGasLimit = verificationGasLimit;
        uint128 maxPriorityFeePerGas = 256;
        uint128 maxFeePerGas = maxPriorityFeePerGas;

        // Packed gas parameters
        bytes32 accountGasLimits = bytes32((uint256(verificationGasLimit) << 128) | uint256(callGasLimit));
        bytes32 gasFees = bytes32((uint256(maxFeePerGas) << 128) | uint256(maxPriorityFeePerGas));

        // paymasterAndData layout (ERC-4337 v0.7):
        // [ paymaster address (20 bytes) | verificationGasLimit (16 bytes) | postOpGasLimit (16 bytes) ]
        uint128 paymasterVerificationGasLimit = verificationGasLimit;
        uint128 paymasterPostOpGasLimit = verificationGasLimit;
        bytes memory paymasterAndData = paymaster != address(0)
            ? abi.encodePacked(paymaster, paymasterVerificationGasLimit, paymasterPostOpGasLimit)
            : bytes("");

        return PackedUserOperation({
            sender: sender,
            nonce: nonce,
            initCode: bytes(""), // Empty for existing accounts
            callData: callData,
            accountGasLimits: accountGasLimits,
            preVerificationGas: verificationGasLimit,
            gasFees: gasFees,
            paymasterAndData: paymasterAndData,
            signature: bytes("") // Empty signature for unsigned operations
        });
    }

    function generateSignedUserOp(
        address scwSender,
        bytes memory callData,
        NetworkConfig memory _config,
        address paymaster
    ) public view returns (PackedUserOperation memory) {
        // ── 1. Generate the unsigned PackedUserOperation data
        uint256 nonce = IEntryPoint(_config.entryPoint).getNonce(scwSender, 0);

        PackedUserOperation memory userOp = _generateUserOp(callData, scwSender, nonce, paymaster);

        // ── 2. Get the userOpHash from the EntryPoint contract
        bytes32 userOpHash = IEntryPoint(_config.entryPoint).getUserOpHash(userOp);
        // Prepare the userOpHash for EIP-191 signature
        bytes32 digest = userOpHash.toEthSignedMessageHash();
        uint8 v;
        bytes32 r;
        bytes32 s;
        // ── 3. Sign the digest ───────────────────
        (v, r, s) = vm.sign(_config.signerKey, digest);
        // computte the packed signature
        userOp.signature = abi.encodePacked(r, s, v); // the order of the siganture components is important

        return userOp;
    }
}

