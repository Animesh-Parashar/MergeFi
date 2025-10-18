// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract RewardPool {
    address public maintainer;
    uint256 public totalFund;
    
    struct Contributor {
        address wallet;
        uint256 allocation; // percentage in basis points (10000 = 100%)
        string githubUsername;
        bool isActive;
    }
    
    mapping(address => Contributor) public contributors;
    address[] public contributorAddresses;
    
    event FundSet(uint256 totalAmount);
    event ContributorAdded(address contributor, uint256 allocation, string githubUsername);
    event ContributorUpdated(address contributor, uint256 newAllocation);
    event ContributorRemoved(address contributor);
    
    modifier onlyMaintainer() {
        require(msg.sender == maintainer, "Not authorized: Only maintainer");
        _;
    }
    
    constructor(address _maintainer) {
        maintainer = _maintainer;
    }
    
    // Set total fund amount (to be transferred via Avail SDK)
    function setTotalFund(uint256 _totalFund) external onlyMaintainer {
        totalFund = _totalFund;
        emit FundSet(_totalFund);
    }
    
    // Add or update contributor allocation
    function setContributorAllocation(
        address _contributor, 
        uint256 _allocation, 
        string memory _githubUsername
    ) external onlyMaintainer {
        require(_contributor != address(0), "Invalid contributor address");
        require(_allocation > 0 && _allocation <= 10000, "Allocation must be between 1-10000 basis points");
        require(getTotalAllocations() - contributors[_contributor].allocation + _allocation <= 10000, "Total allocation exceeds 100%");
        
        bool isNewContributor = !contributors[_contributor].isActive;
        
        contributors[_contributor] = Contributor({
            wallet: _contributor,
            allocation: _allocation,
            githubUsername: _githubUsername,
            isActive: true
        });
        
        if (isNewContributor) {
            contributorAddresses.push(_contributor);
            emit ContributorAdded(_contributor, _allocation, _githubUsername);
        } else {
            emit ContributorUpdated(_contributor, _allocation);
        }
    }
    
    // Remove contributor
    function removeContributor(address _contributor) external onlyMaintainer {
        require(contributors[_contributor].isActive, "Contributor not found");
        
        contributors[_contributor].isActive = false;
        contributors[_contributor].allocation = 0;
        
        // Remove from array
        for (uint i = 0; i < contributorAddresses.length; i++) {
            if (contributorAddresses[i] == _contributor) {
                contributorAddresses[i] = contributorAddresses[contributorAddresses.length - 1];
                contributorAddresses.pop();
                break;
            }
        }
        
        emit ContributorRemoved(_contributor);
    }
    
    // Get contributor's allocated amount in PYUSD
    function getContributorAmount(address _contributor) external view returns (uint256) {
        if (!contributors[_contributor].isActive || totalFund == 0) {
            return 0;
        }
        return (totalFund * contributors[_contributor].allocation) / 10000;
    }
    
    // Get all active contributors for Avail SDK
    function getAllContributors() external view returns (
        address[] memory addresses,
        uint256[] memory allocations,
        uint256[] memory amounts,
        string[] memory githubUsernames
    ) {
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
                amounts[index] = totalFund > 0 ? (totalFund * contributors[addr].allocation) / 10000 : 0;
                githubUsernames[index] = contributors[addr].githubUsername;
                index++;
            }
        }
    }
    
    // Get total allocated percentage
    function getTotalAllocations() public view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < contributorAddresses.length; i++) {
            if (contributors[contributorAddresses[i]].isActive) {
                total += contributors[contributorAddresses[i]].allocation;
            }
        }
        return total;
    }
    
    // Get remaining allocation available
    function getRemainingAllocation() external view returns (uint256) {
        return 10000 - getTotalAllocations();
    }
    
    // Get contributor count
    function getContributorCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint i = 0; i < contributorAddresses.length; i++) {
            if (contributors[contributorAddresses[i]].isActive) {
                count++;
            }
        }
        return count;
    }
}
