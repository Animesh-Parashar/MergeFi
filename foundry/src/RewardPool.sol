// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardPool is Ownable {
    struct Contributor {
        address wallet;
        uint256 allocation; // basis points (10000 = 100%)
        string githubUsername;
        bool isActive;
    }

    mapping(address => Contributor) public contributors;
    address[] public contributorAddresses;

    uint256 public totalFund;
    uint256 public totalAllocations; // Sum of all allocations in basis points

    event ContributorAdded(
        address indexed contributor,
        uint256 allocation,
        string githubUsername
    );
    event AllocationUpdated(
        address indexed contributor,
        uint256 oldAllocation,
        uint256 newAllocation
    );
    event TotalFundSet(uint256 amount);

    constructor(address _maintainer) Ownable(_maintainer) {}

    function setTotalFund(uint256 _totalFund) external onlyOwner {
        totalFund = _totalFund;
        emit TotalFundSet(_totalFund);
    }

    function setContributorAllocation(
        address contributor,
        uint256 allocation,
        string memory githubUsername
    ) external onlyOwner {
        require(contributor != address(0), "Invalid contributor address");
        require(allocation > 0 && allocation <= 10000, "Invalid allocation");
        require(
            bytes(githubUsername).length > 0,
            "GitHub username cannot be empty"
        );

        bool isNewContributor = !contributors[contributor].isActive;
        uint256 oldAllocation = contributors[contributor].allocation;

        if (isNewContributor) {
            contributorAddresses.push(contributor);
            contributors[contributor] = Contributor({
                wallet: contributor,
                allocation: allocation,
                githubUsername: githubUsername,
                isActive: true
            });
            totalAllocations += allocation;
            emit ContributorAdded(contributor, allocation, githubUsername);
        } else {
            totalAllocations = totalAllocations - oldAllocation + allocation;
            contributors[contributor].allocation = allocation;
            contributors[contributor].githubUsername = githubUsername;
            emit AllocationUpdated(contributor, oldAllocation, allocation);
        }

        require(totalAllocations <= 10000, "Total allocations exceed 100%");
    }

    function getContributorAmount(
        address contributor
    ) external view returns (uint256) {
        require(contributors[contributor].isActive, "Contributor not active");
        return (totalFund * contributors[contributor].allocation) / 10000;
    }

    function getTotalAllocations() external view returns (uint256) {
        return totalAllocations;
    }

    function getRemainingAllocation() external view returns (uint256) {
        return 10000 - totalAllocations;
    }

    function getAllContributors()
        external
        view
        returns (
            address[] memory addresses,
            uint256[] memory allocations,
            uint256[] memory amounts,
            string[] memory githubUsernames
        )
    {
        uint256 activeCount = 0;

        // Count active contributors
        for (uint i = 0; i < contributorAddresses.length; i++) {
            if (contributors[contributorAddresses[i]].isActive) {
                activeCount++;
            }
        }

        addresses = new address[](activeCount);
        allocations = new uint256[](activeCount);
        amounts = new uint256[](activeCount);
        githubUsernames = new string[](activeCount);

        uint256 index = 0;
        for (uint i = 0; i < contributorAddresses.length; i++) {
            address addr = contributorAddresses[i];
            if (contributors[addr].isActive) {
                addresses[index] = addr;
                allocations[index] = contributors[addr].allocation;
                amounts[index] =
                    (totalFund * contributors[addr].allocation) /
                    10000;
                githubUsernames[index] = contributors[addr].githubUsername;
                index++;
            }
        }
    }

    function getContributorCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint i = 0; i < contributorAddresses.length; i++) {
            if (contributors[contributorAddresses[i]].isActive) {
                count++;
            }
        }
        return count;
    }

    function removeContributor(address contributor) external onlyOwner {
        require(contributors[contributor].isActive, "Contributor not active");

        totalAllocations -= contributors[contributor].allocation;
        contributors[contributor].isActive = false;

        // Note: We don't remove from contributorAddresses array to maintain historical data
        // The getAllContributors function filters by isActive status
    }
}
