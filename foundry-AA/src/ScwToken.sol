// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ScwToken is ERC20, Ownable {
    constructor() ERC20("ScwToken", "SCW") Ownable(msg.sender) {
        // The initial supply will be managed by the owner minting tokens as needed,
        // rather than minting a fixed supply at deployment.
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
