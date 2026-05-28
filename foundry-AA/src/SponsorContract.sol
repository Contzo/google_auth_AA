// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// import {IPaymaster, PackedUserOperation} from "account-abstraction/interfaces/IPaymaster.sol";
import {ScwFactory} from "./ScwFactory.sol";

contract SponsorContract {
    /*//////////////////////////////////////////////////////////////
                                 Errors
    //////////////////////////////////////////////////////////////*/
    error SponsorContract__NoZeroAddress();

    /*//////////////////////////////////////////////////////////////
                            State Variables
    //////////////////////////////////////////////////////////////*/
    ScwFactory private immutable I_SCW_FACTORY;

    constructor(address _scwFactory) {
        if (_scwFactory == address(0)) revert SponsorContract__NoZeroAddress();
        I_SCW_FACTORY = ScwFactory(_scwFactory);
    }
}

