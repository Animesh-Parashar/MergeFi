// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract RewardPool {
    address public maintainer;
    address public registry; // MergeFiRegistry contract
    uint256 public totalFund;

    struct Contributor {
        address wallet;
        string githubUsername; 
        uint256 contributionCount; // Number of contributions
        bool isActive;
    }

    mapping(address => Contributor) public contributors;
    address[] public contributorAddresses;

    event FundSet(uint256 totalAmount);
    event ContributorAdded(
        address contributor,
        uint256 allocation,
        string githubUsername
    );
    event ContributorUpdated(address contributor, uint256 newAllocation);
    event ContributorRemoved(address contributor);

    modifier onlyMaintainer() {
        require(msg.sender == maintainer, "Not authorized: Only maintainer");
        _;
    }

    modifier onlyRegistry() {
        require(msg.sender == registry, "Not authorized: Only registry");
        _;
    }

    constructor(address _maintainer, address _registry) {
        maintainer = _maintainer;
        registry = _registry;
    }

    // Set total fund amount (to be transferred via Avail SDK)
    function setTotalFund(uint256 _totalFund) external onlyMaintainer {
        totalFund = _totalFund;
        emit FundSet(_totalFund);
    }

    // Add or update contributor with AI score
    function setContributor(
        address _contributor,
        string memory _githubUsername,
        uint256 _aiScore,
        uint256 _contributionCount
    ) external onlyRegistry {
        require(_contributor != address(0), "Invalid contributor address");
        require(_aiScore <= 10000, "AI score must be between 0-10000");

        bool isNewContributor = !contributors[_contributor].isActive;

        contributors[_contributor] = Contributor({
            wallet: _contributor,
            githubUsername: _githubUsername,
            aiScore: _aiScore,
            contributionCount: _contributionCount,
            isActive: true
        });

        if (isNewContributor) {
            contributorAddresses.push(_contributor);
            emit ContributorAdded(_contributor, _aiScore, _githubUsername);
        } else {
            emit ContributorUpdated(_contributor, _aiScore);
        }
    }

    function isContributorActive(
        address _contributor
    ) external view returns (bool) {
        return contributors[_contributor].isActive;
    }

    // Update AI scores (called by AI model through registry)
    function updateAIScore(
        address _contributor,
        uint256 _newScore
    ) external onlyRegistry {
        require(contributors[_contributor].isActive, "Contributor not found");
        require(_newScore <= 10000, "AI score must be between 0-10000");

        contributors[_contributor].aiScore = _newScore;
        emit ContributorUpdated(_contributor, _newScore);
    }

    // Remove contributor
    function removeContributor(address _contributor) external onlyMaintainer {
        require(contributors[_contributor].isActive, "Contributor not found");

        contributors[_contributor].isActive = false;
        // contributors[_contributor].allocation = 0;

        // Remove from array
        for (uint i = 0; i < contributorAddresses.length; i++) {
            if (contributorAddresses[i] == _contributor) {
                contributorAddresses[i] = contributorAddresses[
                    contributorAddresses.length - 1
                ];
                contributorAddresses.pop();
                break;
            }
        }

        emit ContributorRemoved(_contributor);
    }

    // Get contributor's allocated amount based on AI score
    function getContributorAmount(
        address _contributor
    ) external view returns (uint256) {
        if (!contributors[_contributor].isActive || totalFund == 0) {
            return 0;
        }

        uint256 totalScores = getTotalAIScores();
        if (totalScores == 0) return 0;

        return (totalFund * contributors[_contributor].aiScore) / totalScores;
    }

    // Get total AI scores for calculation
    function getTotalAIScores() public view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < contributorAddresses.length; i++) {
            if (contributors[contributorAddresses[i]].isActive) {
                total += contributors[contributorAddresses[i]].aiScore;
            }
        }
        return total;
    }

    // Get all active contributors for Avail SDK
    function getAllContributors()
        external
        view
        returns (
            address[] memory addresses,
            uint256[] memory aiScores,
            uint256[] memory amounts,
            uint256[] memory contributionCounts,
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
        aiScores = new uint256[](activeCount);
        amounts = new uint256[](activeCount);
        contributionCounts = new uint256[](activeCount);
        githubUsernames = new string[](activeCount);

        uint256 totalScores = getTotalAIScores();
        uint256 index = 0;

        for (uint i = 0; i < contributorAddresses.length; i++) {
            address addr = contributorAddresses[i];
            if (contributors[addr].isActive) {
                addresses[index] = addr;
                aiScores[index] = contributors[addr].aiScore;
                amounts[index] = totalScores > 0
                    ? (totalFund * contributors[addr].aiScore) / totalScores
                    : 0;
                contributionCounts[index] = contributors[addr]
                    .contributionCount;
                githubUsernames[index] = contributors[addr].githubUsername;
                index++;
            }
        }
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

    // Get average AI score
    function getAverageAIScore() external view returns (uint256) {
        uint256 activeCount = this.getContributorCount();
        if (activeCount == 0) return 0;
        return getTotalAIScores() / activeCount;
    }
}
