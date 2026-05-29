// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPaymaster, PackedUserOperation} from "account-abstraction/interfaces/IPaymaster.sol";
import {IScwFactory} from "./interfaces/IScwFactory.sol";

contract SponsorContract is IPaymaster {
    /*//////////////////////////////////////////////////////////////
                                 Errors
    //////////////////////////////////////////////////////////////*/
    error SponsorContract__NoZeroAddress();

    /*//////////////////////////////////////////////////////////////
                            State Variables
    //////////////////////////////////////////////////////////////*/
    address private immutable I_SCW_FACTORY;

    /*//////////////////////////////////////////////////////////////
                           External functions
    //////////////////////////////////////////////////////////////*/

    constructor(address _scwFactory) {
        if (_scwFactory == address(0)) revert SponsorContract__NoZeroAddress();
        I_SCW_FACTORY = I_SCW_FACTORY;
    }

    function validatePaymasterUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 maxCost)
        external
        returns (bytes memory context, uint256 validationData)
    {}
}

