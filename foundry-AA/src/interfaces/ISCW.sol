// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";

interface ISCW {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error SCW__NotFromEntryPoint();
    error SCW__NotFromEntryPointOrOwner();
    error SCW__CallFailed(bytes result);
    error SCW__NotEnoughFunds(uint256 currentEthBalance, uint256 requiredEthBalance);
    error SCW__InvalidNonce(uint256 currentNonce, uint256 providedNonce);
    error SCW__ZeroAddress();
    error SCW__InvalidDestination(address dest);

    /*//////////////////////////////////////////////////////////////
                                  EVENTS
    //////////////////////////////////////////////////////////////*/

    event SCWExecuted(address indexed dest, uint256 value, bytes functionData);
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event PrefundPaid(uint256 amount);

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        external
        returns (uint256 validationData);

    function execute(address dest, uint256 value, bytes calldata functionData) external;

    function updateUserOperationSigner(address _newSigner) external;

    /*//////////////////////////////////////////////////////////////
                                GETTERS
    //////////////////////////////////////////////////////////////*/

    function getEntryPoint() external view returns (address);
    function getUserOperationSigner() external view returns (address);
    function getErc20Token() external view returns (address);
}
