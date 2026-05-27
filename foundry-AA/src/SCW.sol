// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAccount} from "account-abstraction/interfaces/IAccount.sol";
import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "account-abstraction/core/Helpers.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";

/// @title SCW — Smart Contract Wallet
/// @author AA Wallet Project
/// @notice A minimal ERC-4337 compatible smart contract wallet that authenticates
///         UserOperations via a centralized backend signing key instead of a user-held
///         private key. Designed for Google OAuth-based account abstraction flows where
///         the backend acts as the authorized transaction signer on behalf of the user.
/// @dev Implements the IAccount interface required by the ERC-4337 EntryPoint.
///      Transaction authorization is delegated to `s_UserOperationSigner` — a backend
///      EOA that signs UserOperation hashes off-chain. The EntryPoint is the only entity
///      allowed to call `validateUserOp`. Execution is restricted to the EntryPoint or
///      the contract owner as an emergency bypass. Gas fees are handled either by a
///      Paymaster (sponsored) or by the SCW itself via the prefund mechanism.
contract SCW is IAccount, Ownable {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when a function restricted to the EntryPoint is called by another address.
    error SCW__NotFromEntryPoint();

    /// @notice Thrown when a function restricted to the EntryPoint or owner is called by another address.
    error SCW__NotFromEntryPointOrOwner();

    /// @notice Thrown when a low-level call to the destination contract fails.
    /// @param result The raw revert bytes returned by the failed call.
    error SCW__CallFailed(bytes result);

    /// @notice Thrown when the SCW does not hold enough ETH to cover the required prefund.
    /// @param currentEthBalance The current ETH balance of this SCW.
    /// @param requiredEthBalance The ETH amount required by the EntryPoint as prefund.
    error SCW__NotEnoughFunds(uint256 currentEthBalance, uint256 requiredEthBalance);

    /// @notice Thrown when the nonce in the UserOperation does not match the EntryPoint's stored nonce.
    /// @param currentNonce The nonce currently registered for this account in the EntryPoint.
    /// @param providedNonce The nonce value supplied in the UserOperation.
    error SCW__InvalidNonce(uint256 currentNonce, uint256 providedNonce);

    /// @notice Thrown when a zero address is provided where a non-zero address is required.
    error SCW__ZeroAddress();

    /// @notice Thrown when `execute` is called targeting a contract other than the allowed ERC-20 token.
    /// @param dest The disallowed destination address that was provided.
    error SCW__InvalidDestination(address dest);

    /*//////////////////////////////////////////////////////////////
                                  EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted after a successful call from `execute`.
    /// @param dest The contract that was called.
    /// @param value The ETH value forwarded with the call.
    /// @param functionData The raw calldata forwarded to `dest`.
    event SCWExecuted(address indexed dest, uint256 value, bytes functionData);

    /// @notice Emitted when the authorized UserOperation signer is rotated.
    /// @param oldSigner The signer address being replaced.
    /// @param newSigner The new signer address now authorized to sign UserOperations.
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);

    /// @notice Emitted when the SCW sends a prefund to the EntryPoint.
    /// @param amount The ETH amount sent to the EntryPoint as prefund.
    event PrefundPaid(uint256 amount);

    /*//////////////////////////////////////////////////////////////
                             STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The canonical ERC-4337 EntryPoint this wallet is bound to.
    /// @dev Immutable — set once at deployment and never changed.
    IEntryPoint private immutable I_ENTRY_POINT;

    /// @notice The backend EOA authorized to sign UserOperations for this wallet.
    /// @dev Mutable to allow key rotation if the backend signing key is compromised.
    ///      Only the contract owner can update this value via `updateUserOperationSigner`.
    address private s_UserOperationSigner;

    /// @notice The only ERC-20 token contract this wallet is permitted to call.
    /// @dev Restricts `execute` to a single token address, limiting the attack surface
    ///      in the event that the backend signing key is compromised.
    address private immutable I_ERC20_TOKEN;

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Restricts access to the EntryPoint contract only.
    modifier requireFromEntryPoint() {
        _requireFromEntryPoint();
        _;
    }

    /// @notice Restricts access to the EntryPoint contract or the wallet owner.
    /// @dev The owner bypass exists as an emergency escape hatch if the EntryPoint
    ///      is unavailable or if the AA flow needs to be bypassed during development.
    modifier requireFromEntryPointOrOwner() {
        _requireFromEntryPointOrOwner();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Deploys the SCW and binds it to a specific EntryPoint, signer, and ERC-20 token.
    /// @dev The deploying address becomes the Ownable owner. All three addresses must be
    ///      non-zero — a zero address for any of them renders the wallet permanently broken.
    /// @param _entryPoint          The canonical ERC-4337 EntryPoint address on this chain.
    /// @param _userOperationSigner The backend EOA that will sign UserOperation hashes.
    /// @param _erc20Token          The ERC-20 token contract this wallet is permitted to call.
    constructor(address _entryPoint, address _userOperationSigner, address _erc20Token) Ownable(msg.sender) {
        if (_entryPoint == address(0) || _userOperationSigner == address(0) || _erc20Token == address(0)) {
            revert SCW__ZeroAddress();
        }
        I_ENTRY_POINT = IEntryPoint(_entryPoint);
        s_UserOperationSigner = _userOperationSigner;
        I_ERC20_TOKEN = _erc20Token;
    }

    /// @notice Allows the wallet to receive ETH directly, e.g. for gas prefunding.
    receive() external payable {}

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IAccount
    /// @notice Validates an incoming UserOperation and optionally pays the gas prefund.
    /// @dev Called exclusively by the EntryPoint as part of the ERC-4337 validation phase.
    ///      The function performs three sequential checks:
    ///        1. Signature — verifies the UserOperation was signed by `s_UserOperationSigner`.
    ///        2. Nonce     — verifies the UserOperation nonce matches the EntryPoint's record.
    ///        3. Prefund   — sends ETH to the EntryPoint if no Paymaster is sponsoring the tx.
    ///      If a Paymaster is set in the UserOperation, `missingAccountFunds` will be 0
    ///      and `_payPrefund` becomes a no-op.
    /// @param userOp              The packed UserOperation submitted by the Bundler.
    /// @param userOpHash          The canonical EIP-191 hash of the UserOperation, computed
    ///                            by the EntryPoint. This is what the backend signed off-chain.
    /// @param missingAccountFunds ETH the SCW must send to the EntryPoint to cover gas.
    ///                            Zero when a Paymaster is sponsoring the transaction.
    /// @return validationData     Packed validation result. 0 = success, 1 = failure.
    ///                            Can also encode a time validity window (validAfter/validUntil).
    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        external
        override
        requireFromEntryPoint
        returns (uint256 validationData)
    {
        validationData = _validateSignature(userOp, userOpHash);
        _validateNonce(userOp.nonce);
        _payPrefund(missingAccountFunds);
        return validationData;
    }

    /// @notice Executes a call to the permitted ERC-20 token contract on behalf of the wallet.
    /// @dev Can be called by the EntryPoint (normal AA flow) or the owner (emergency bypass).
    ///      The destination is restricted to `I_ERC20_TOKEN` to limit the blast radius of a
    ///      compromised backend signing key — even a rogue UserOp cannot call arbitrary contracts.
    /// @param dest         The target contract address. Must equal `I_ERC20_TOKEN`.
    /// @param value        ETH to forward with the call. Typically 0 for ERC-20 interactions.
    /// @param functionData ABI-encoded function call to invoke on `dest` (the inner calldata
    ///                     layer, e.g. `ERC20.transfer(recipient, amount)` encoded).
    function execute(address dest, uint256 value, bytes calldata functionData) external requireFromEntryPointOrOwner {
        if (dest != I_ERC20_TOKEN) revert SCW__InvalidDestination(dest);
        (bool success, bytes memory result) = dest.call{value: value}(functionData);
        if (!success) revert SCW__CallFailed(result);
        emit SCWExecuted(dest, value, functionData);
    }

    /// @notice Rotates the backend signing key authorized to sign UserOperations.
    /// @dev Restricted to the contract owner. Should be called immediately if the current
    ///      `s_UserOperationSigner` key is suspected to be compromised. The new signer
    ///      takes effect for all subsequent UserOperations — previously signed but unsubmitted
    ///      UserOps will fail validation after rotation.
    /// @param _newSigner The new backend EOA address to authorize as the UserOperation signer.
    function updateUserOperationSigner(address _newSigner) external onlyOwner {
        if (_newSigner == address(0)) revert SCW__ZeroAddress();
        address oldSigner = s_UserOperationSigner;
        s_UserOperationSigner = _newSigner;
        emit SignerUpdated(oldSigner, _newSigner);
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Reverts if the caller is not the EntryPoint.
    function _requireFromEntryPoint() internal view {
        if (msg.sender != address(I_ENTRY_POINT)) revert SCW__NotFromEntryPoint();
    }

    /// @notice Reverts if the caller is neither the EntryPoint nor the contract owner.
    function _requireFromEntryPointOrOwner() internal view {
        if (msg.sender != address(I_ENTRY_POINT) && msg.sender != owner()) {
            revert SCW__NotFromEntryPointOrOwner();
        }
    }

    /// @notice Verifies the UserOperation signature against the authorized backend signer.
    /// @dev Wraps `userOpHash` in an EIP-191 personal sign prefix before recovery,
    ///      matching the off-chain signing convention used by the backend:
    ///        digest = keccak256("\x19Ethereum Signed Message:\n32" + userOpHash)
    ///      This ensures signatures cannot be reused across different signing contexts.
    /// @param userOp     The UserOperation whose `signature` field is being verified.
    /// @param userOpHash The EntryPoint-computed hash of the UserOperation (pre-EIP-191).
    /// @return validationData 0 (SIG_VALIDATION_SUCCESS) if signer matches, 1 (SIG_VALIDATION_FAILED) otherwise.
    function _validateSignature(PackedUserOperation calldata userOp, bytes32 userOpHash)
        internal
        view
        returns (uint256 validationData)
    {
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        address signer = ECDSA.recover(ethSignedMessageHash, userOp.signature);
        if (signer != s_UserOperationSigner) return SIG_VALIDATION_FAILED;
        return SIG_VALIDATION_SUCCESS;
    }

    /// @notice Forwards the required prefund ETH to the EntryPoint.
    /// @dev Only executes a transfer when `missingAccountFunds` is non-zero. When a
    ///      Paymaster is sponsoring the transaction, the EntryPoint passes 0 here and
    ///      this function becomes a no-op. The `gas: type(uint256).max` forwarding
    ///      ensures the EntryPoint receive function never runs out of gas during the call.
    /// @param missingAccountFunds The ETH shortfall the SCW must cover. 0 when sponsored.
    function _payPrefund(uint256 missingAccountFunds) internal {
        if (missingAccountFunds != 0) {
            (bool success,) = payable(msg.sender).call{value: missingAccountFunds, gas: type(uint256).max}("");
            if (!success) revert SCW__NotEnoughFunds(address(this).balance, missingAccountFunds);
            emit PrefundPaid(missingAccountFunds);
        }
    }

    /// @notice Validates the UserOperation nonce against the EntryPoint's stored value.
    /// @dev The EntryPoint already enforces sequential nonces before calling `validateUserOp`,
    ///      so this is a defense-in-depth check rather than a primary security control.
    ///      Uses key `0` (the default sequential nonce key). Custom nonce schemes
    ///      such as parallel nonces would require a different key.
    /// @param nonce The nonce value from the UserOperation being validated.
    function _validateNonce(uint256 nonce) internal view {
        uint256 currentNonce = I_ENTRY_POINT.getNonce(address(this), 0);
        if (currentNonce != nonce) revert SCW__InvalidNonce(currentNonce, nonce);
    }

    /*//////////////////////////////////////////////////////////////
                                GETTERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Returns the EntryPoint address this wallet is bound to.
    function getEntryPoint() external view returns (address) {
        return address(I_ENTRY_POINT);
    }

    /// @notice Returns the current backend EOA authorized to sign UserOperations.
    function getUserOperationSigner() external view returns (address) {
        return s_UserOperationSigner;
    }

    /// @notice Returns the ERC-20 token contract this wallet is restricted to calling.
    function getErc20Token() external view returns (address) {
        return I_ERC20_TOKEN;
    }
}
