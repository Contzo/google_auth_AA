// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IScwFactory {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error ScwFactory__zeroAddress();
    error ScwFactory__NonZeroValue();
    error ScwFactory__NotAuthorizedDeployer();
    error ScwFactory__AlreadyDeployed();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event SCWDeployed(bytes32 credentialHash, address scwAddress);

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function deployScw(bytes32 credentialHash) external returns (address);

    function updateSigner(address _newSigner) external;

    function updateDeployer(address _newDeployer) external;

    /*//////////////////////////////////////////////////////////////
                                GETTERS
    //////////////////////////////////////////////////////////////*/

    function predictScwAddress(bytes32 credentialHash) external view returns (address);
    function getScwAddress(bytes32 credentialHash) external view returns (address);
    function isValidScw(address scwAddress) external view returns (bool);
    function getAuthorizedDeployer() external view returns (address);
    function getAuthorizedSigner() external view returns (address);
    function getEntryPoint() external view returns (address);
    function getErc20Token() external view returns (address);

    // Public mapping getters
    function sCredentialToScw(bytes32 credentialHash) external view returns (address);
    function sIsFactoryScw(address scwAddress) external view returns (bool);
}
