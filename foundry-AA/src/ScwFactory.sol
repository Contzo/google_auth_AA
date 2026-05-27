// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SCW} from "./SCW.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ScwFactory — Smart Contract Wallet Factory
/// @author Ilie Razvan
/// @notice A factory contract that deploys and tracks SCW for every user that logged in with Google. Uses a CREATE2 deterministic address derived from             a credential hashed derived from each user Google's identity.
/// @dev All the deployements will be done by the backend signing key. This factory enables counterfactual deployments by predicting the address of the           SCW contract before it is deployed, using the CREATE2 mechanism with the credential hash as the salt

contract ScwFactory is Ownable {
    /*//////////////////////////////////////////////////////////////
                                 Errors
    //////////////////////////////////////////////////////////////*/
    error ScwFactory__zeroAddress();
    error ScwFactory__NonZeroValue();
    error ScwFactory__NotAuthorizedDeployer();
    error ScwFactory__AlreadyDeployed();
    /*//////////////////////////////////////////////////////////////
                                 Events
    //////////////////////////////////////////////////////////////*/
    event SCWDeployed(bytes32 credentialHash, address scwAddress);

    /*//////////////////////////////////////////////////////////////
                            State variables
    //////////////////////////////////////////////////////////////*/

    /// @notice a mapping of credentialHash to SCW address for all the deployed SCW contracts
    mapping(bytes32 credentialHash => address scwAddress) public sCredentialToScw;

    /// @notice reverse lookup of SCW addresses for paymaster validation
    mapping(address scwAddress => bool isValidScw) public sIsFactoryScw;

    /// @notice address of the authorized backend deployer
    address private sAuthorizedDeployer;

    /// @notice addresses needed to deploy SCW contracts
    IEntryPoint private immutable I_ENTRY_POINT;
    address private immutable I_ERC20_TOKEN;
    address private sAuthorizedSigner;

    /*//////////////////////////////////////////////////////////////
                               Modifiers
    //////////////////////////////////////////////////////////////*/
    modifier onlyAuthorizedDeployer() {
        _onlyAuthorizedDeployer();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                           External functions
    //////////////////////////////////////////////////////////////*/

    /// @notice Deploys thhe SCW facotry contract and binds it to a specific EntryPoint, signer, ERC-20 token and deployer
    /// @dev The deployer of the factory becomes the owner and has the ability to update the authorized deployer and signer. All the addresses must be no            n-zero
    /// @param _entryPoint          The canonical ERC-4337 EntryPoint address on this chain.
    /// @param _erc20Token          The ERC-20 token contract this wallet is restricted to calling.
    /// @param _authorizedDeployer   The address that will be able to deploy SCW contracts
    /// @param _authorizedSigner     The address that will be able to sign UserOperations
    constructor(address _entryPoint, address _erc20Token, address _authorizedDeployer, address _authorizedSigner)
        Ownable(msg.sender)
    {
        if (
            _entryPoint == address(0) || _erc20Token == address(0) || _authorizedDeployer == address(0)
                || _authorizedSigner == address(0)
        ) revert ScwFactory__zeroAddress();
        I_ENTRY_POINT = IEntryPoint(_entryPoint);
        I_ERC20_TOKEN = _erc20Token;
        sAuthorizedDeployer = _authorizedDeployer;
        sAuthorizedSigner = _authorizedSigner;
    }

    /// @notice Updates the authorized signer for new SCW contracts
    /// @dev Only the Owner can update the signer
    /// @param _newSigner The new signer address
    function updateSigner(address _newSigner) external onlyOwner {
        if (_newSigner == address(0)) revert ScwFactory__zeroAddress();
        sAuthorizedSigner = _newSigner;
    }

    /// @notice Updates the authorized deployer for new SCW contracts
    /// @dev Only the Owner can update the deployer
    /// @param _newDeployer The new deployer address
    function updateDeployer(address _newDeployer) external onlyOwner {
        if (_newDeployer == address(0)) revert ScwFactory__zeroAddress();
        sAuthorizedDeployer = _newDeployer;
    }

    /// @notice deploys a new SCW contract for a given credential hash at a deterministic address following the CREATE2 scheme
    /// @dev Only the authorized deployer can deploy new SCW contracts
    /// @param credentialHash The credential hash of the user
    /// @return The address of the deployed SCW contract

    function deployScw(bytes32 credentialHash) external onlyAuthorizedDeployer returns (address) {
        // ── Checks ───────────────────────────────────────
        if (credentialHash == bytes32(0)) revert ScwFactory__NonZeroValue();
        if (sCredentialToScw[credentialHash] != address(0)) revert ScwFactory__AlreadyDeployed();

        // ── Effects ──────────────────────────────────────
        address newScwAddress = predictScwAddress(credentialHash);
        sIsFactoryScw[newScwAddress] = true;
        sCredentialToScw[credentialHash] = newScwAddress;
        emit SCWDeployed(credentialHash, newScwAddress);

        // ── Interactions ─────────────────────────────────
        new SCW{salt: credentialHash}(address(I_ENTRY_POINT), sAuthorizedSigner, I_ERC20_TOKEN);

        return newScwAddress;
    }

    /*//////////////////////////////////////////////////////////////
                                Getters
    //////////////////////////////////////////////////////////////*/

    /// @notice predicst the address of the SCW contract for a given credential hash
    function predictScwAddress(bytes32 credentialHash) public view returns (address) {
        //type(SCW).creationCode is the creation code of the SCW contract,
        // generated by the compiler. When executed by the EVM during deployment:
        //     1. the constructor runs (sets up initial state), just in the TX memory
        //     3. the EVM stores the runtime bytecode at the contract address
        //     4. the creation code is then discarded
        // The creation bytecode is generated just for hashing purposes, and is discarded, no SCW contract is deployed yet
        bytes memory bytecode =
            abi.encodePacked(type(SCW).creationCode, abi.encode(I_ENTRY_POINT, sAuthorizedSigner, I_ERC20_TOKEN));

        // determine the address where the SCW contract will be deployed
        return address(
            uint160(
                uint256(keccak256(abi.encodePacked(bytes1(0xff), address(this), credentialHash, keccak256(bytecode))))
            )
        );
    }

    /// @notice Returns the address of the SCW contract for a given credential hash
    function getScwAddress(bytes32 credentialHash) external view returns (address) {
        return sCredentialToScw[credentialHash];
    }

    /// @notice checks if a given address is a valid SCW contract
    function isValidScw(address scwAddress) external view returns (bool) {
        return sIsFactoryScw[scwAddress];
    }

    /// @notice Returns the Authorized Deployer address
    function getAuthorizedDeployer() external view returns (address) {
        return sAuthorizedDeployer;
    }

    /// @notice Returns the Authorized Signer address
    function getAuthorizedSigner() external view returns (address) {
        return sAuthorizedSigner;
    }

    /// @notice Returns the EntryPoint address
    function getEntryPoint() external view returns (address) {
        return address(I_ENTRY_POINT);
    }

    /// @notice Returns the ERC-20 token contract this wallet is restricted to calling.
    function getErc20Token() external view returns (address) {
        return I_ERC20_TOKEN;
    }

    /*//////////////////////////////////////////////////////////////
                           Internal functions
    //////////////////////////////////////////////////////////////*/
    function _onlyAuthorizedDeployer() internal view {
        if (msg.sender != sAuthorizedDeployer) revert ScwFactory__NotAuthorizedDeployer();
    }
}

