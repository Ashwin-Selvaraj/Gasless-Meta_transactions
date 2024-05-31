// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Sum {
    uint public sum;

    function add(uint _a) public {
        sum = _a;
    }
}
