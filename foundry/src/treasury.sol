// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

// TODO_1:pre-fund this contract with PYUSD.
// TODO_2: deploy on both arbitrum and sepolia

contract PyusdTreasury {
    address public owner;
    IERC20 public pyusd; // PYUSD token contract

    constructor(address _pyusd) {
        owner = msg.sender;
        pyusd = IERC20(_pyusd);
    }

    // callable only via Avail bridge execution
    function sendPYUSD(address to, uint256 amount) external {
        require(msg.sender == owner, "Not authorized bridge executor");
        pyusd.transfer(to, amount);
    }
}
