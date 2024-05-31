// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

contract MetaSum is ERC2771Context {
    uint public sum;

    constructor(
        ERC2771Forwarder forwarder // Initialize trusted forwarder
    ) ERC2771Context(address(forwarder)) {}

    function add(uint _a) public {
        sum = _a;
    }
}
