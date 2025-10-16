// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;



contract RewardPool {
    IERC20 public pyusd;
    address public maintainer;
    mapping(address => uint256) public rewards;

    event RewardDistributed(address contributor, uint256 amount);

    constructor(address _maintainer) {
        maintainer = _maintainer;
        pyusd = IERC20(0x...); // PyUSD address
    }

    function fund(uint256 amount) external {
        pyusd.transferFrom(msg.sender, address(this), amount);
    }

    function distributeReward(address contributor, uint256 amount) external {
        require(msg.sender == maintainer, "Not authorized");
        pyusd.transfer(contributor, amount);
        rewards[contributor] += amount;
        emit RewardDistributed(contributor, amount);
    }
}
