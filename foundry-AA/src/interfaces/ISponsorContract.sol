// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";

interface ISponsorContract {
    error SponsorContract__NoZeroAddress();

    // Add the functions external callers need:
    function deposit() external payable;
    function withdraw(address payable recipient, uint256 amount) external;
    function getDeposit() external view returns (uint256);
    function validatePaymasterUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 maxCost)
        external
        returns (bytes memory context, uint256 validationData);
}
