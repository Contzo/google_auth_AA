// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPaymaster, PackedUserOperation} from "account-abstraction/interfaces/IPaymaster.sol";
import {IScwFactory} from "./interfaces/IScwFactory.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";

contract SponsorContract is IPaymaster, Ownable {
    /*//////////////////////////////////////////////////////////////
                                 Errors
    //////////////////////////////////////////////////////////////*/
    error SponsorContract__NoZeroAddress();
    error SponsorContract__NotFromEntryPoint();
    error SponsorContract__NotValidSCW();
    error SponsorContract__NotAuthorizedSigner(address signer);

    /*//////////////////////////////////////////////////////////////
                            State Variables
    //////////////////////////////////////////////////////////////*/
    address private immutable I_SCW_FACTORY;
    address public immutable I_ENTRY_POINT;
    address public sAuthorizedSigner;

    /*//////////////////////////////////////////////////////////////
                                   MODIFIERS
        //////////////////////////////////////////////////////////////*/

    /// @notice Restricts access to the EntryPoint contract only.
    modifier requireFromEntryPoint() {
        _requireFromEntryPoint();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                           External functions
    //////////////////////////////////////////////////////////////*/

    constructor(address _scwFactory, address _authorizedSigner, address _entryPoint, address _owner) Ownable(_owner) {
        if (_scwFactory == address(0) || _authorizedSigner == address(0) || _entryPoint == address(0)) {
            revert SponsorContract__NoZeroAddress();
        }
        I_SCW_FACTORY = _scwFactory;
        sAuthorizedSigner = _authorizedSigner;
        I_ENTRY_POINT = _entryPoint;
    }

    /// @notice Checks if from address of the userOp is a SCW contract deployed by the scwFactory and verifies if the
    ///         signer is authorized to sign the userOp
    /// @dev Only the EntryPoint contract can call this function
    /// @param userOp The user operation to validate
    /// @return context        - Value to send to a postOp. Zero length to signify postOp is not required.
    /// @return validationData - Signature and time-range of this operation, encoded the same as the return
    //                          value of validateUserOperation.
    //                           <20-byte> aggregatorOrSigFail - 0 for valid signature, 1 to mark signature failure,
    //                                                     other values are invalid for paymaster.
    //                           <6-byte> validUntil - Last timestamp this operation is valid at, or 0 for "indefinitely"
    //                           <6-byte> validAfter - first timestamp this operation is valid
    //                           Note that the validation code cannot use block.timestamp (or block.number) directly.
    //
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32, // userOpHash,
        uint256 // maxCost
    )
        external
        view
        requireFromEntryPoint
        returns (bytes memory context, uint256 validationData)
    {
        // ── Checks ───────────────────────────────
        address scwAddress = userOp.sender;
        // Check if the sender is a valid SCW contract
        if (!IScwFactory(I_SCW_FACTORY).isValidScw(scwAddress)) {
            return ("", _packValidationData(true, 0, 0));
        }

        return ("", _packValidationData(false, 0, 0));
    }

    function postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost, uint256 actualUserOpFeePerGas)
        external {}

    /// @notice Deposits ETH into the EntryPoint on behalf of this Paymaster
    ///         to fund gas sponsorship for user transactions.
    /// @dev Only the owner can deposit. The ETH is held by the EntryPoint and
    ///      drawn down each time this Paymaster sponsors a UserOperation.
    ///      The EntryPoint's depositTo is payable — the ETH sent with this call
    ///      is credited to this Paymaster's deposit balance.
    function deposit() external payable onlyOwner {
        IEntryPoint(I_ENTRY_POINT).depositTo{value: msg.value}(address(this));
    }

    /// @notice Withdraws ETH from this Paymaster's deposit in the EntryPoint.
    /// @dev Only the owner can withdraw. The EntryPoint sends ETH directly
    ///      to the recipient — it never passes through this contract.
    /// @param recipient The address to receive the withdrawn ETH.
    /// @param amount    The amount of ETH to withdraw in wei.
    function withdraw(address payable recipient, uint256 amount) external onlyOwner {
        if (recipient == address(0)) revert SponsorContract__NoZeroAddress();
        IEntryPoint(I_ENTRY_POINT).withdrawTo(recipient, amount);
    }

    /// @notice Returns the current ETH deposit balance of this Paymaster in the EntryPoint.
    /// @dev The EntryPoint deducts from this balance each time a sponsored UserOp executes.
    ///      Monitor this value and top up via deposit() before it reaches zero.
    function getDeposit() external view returns (uint256) {
        return IEntryPoint(I_ENTRY_POINT).balanceOf(address(this));
    }
    /*//////////////////////////////////////////////////////////////
                           Internal functions
    //////////////////////////////////////////////////////////////*/

    function _requireFromEntryPoint() internal view {
        if (msg.sender != I_ENTRY_POINT) {
            revert SponsorContract__NotFromEntryPoint();
        }
    }

    /// @notice Packs the validation data into a single uint256
    /// @param sigFailed The signature validation failure flag
    /// @param validUntil The timestamp until which the signature is valid
    /// @param validAfter The timestamp from which the signature is valid
    /// @return The packed validation data
    function _packValidationData(bool sigFailed, uint48 validUntil, uint48 validAfter) internal pure returns (uint256) {
        return uint256(sigFailed ? 1 : 0) | (uint256(validUntil) << 160) | (uint256(validAfter) << 208);
    }
}

