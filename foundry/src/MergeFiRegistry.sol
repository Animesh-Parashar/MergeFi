// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./RewardPool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MergeFiRegistry is Ownable {
    struct Repo {
        string name;
        string githubUrl;
        address maintainer;
        address pool;
        bool verified;
        uint256 totalFunding;
        uint256 contributorCount;
        uint256 createdAt;
    }

    struct PaymentData {
        address recipient;
        uint256 amount;
        uint256 chainId;
        string githubUsername;
        string repoName;
        uint256 aiScore;
        uint256 contributionCount;
    }

    mapping(string => Repo) public repos;
    mapping(address => string[]) public maintainerRepos;
    string[] public allRepos;

    // AI Model integration
    mapping(address => bool) public authorizedAIModels;

    event RepoRegistered(
        string repoName,
        address maintainer,
        address pool,
        string githubUrl
    );
    event RepoVerified(string repoName);
    event FundingUpdated(string repoName, uint256 newAmount);
    event ContributorScoreUpdated(
        string repoName,
        address contributor,
        uint256 newScore
    );
    event AIModelAuthorized(address aiModel, bool authorized);

    modifier onlyAuthorizedAI() {
        require(
            authorizedAIModels[msg.sender] || msg.sender == owner(),
            "Not authorized AI model"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    function registerRepo(
        string memory repoName,
        string memory githubUrl
    ) external {
        require(
            repos[repoName].maintainer == address(0),
            "Repo already registered"
        );
        require(bytes(repoName).length > 0, "Repo name cannot be empty");
        require(bytes(githubUrl).length > 0, "GitHub URL cannot be empty");

        // Deploy new pool
        address pool = address(new RewardPool(msg.sender, address(this)));

        // Store repo info
        repos[repoName] = Repo({
            name: repoName,
            githubUrl: githubUrl,
            maintainer: msg.sender,
            pool: pool,
            verified: false,
            totalFunding: 0,
            contributorCount: 0,
            createdAt: block.timestamp
        });

        maintainerRepos[msg.sender].push(repoName);
        allRepos.push(repoName);

        emit RepoRegistered(repoName, msg.sender, pool, githubUrl);
    }

    function verifyRepo(string memory repoName) external onlyOwner {
        require(repos[repoName].maintainer != address(0), "Repo not found");
        require(!repos[repoName].verified, "Repo already verified");

        repos[repoName].verified = true;
        emit RepoVerified(repoName);
    }

    // Update funding for a repo (called when maintainer sets total fund)
    function updateRepoFunding(
        string memory repoName,
        uint256 totalFund
    ) external {
        require(
            repos[repoName].maintainer == msg.sender,
            "Not authorized: Not repo maintainer"
        );

        repos[repoName].totalFunding = totalFund;
        RewardPool(repos[repoName].pool).setTotalFund(totalFund);

        emit FundingUpdated(repoName, totalFund);
    }

    // Add contributor with initial data (called by maintainer)
    function addContributor(
        string memory repoName,
        address contributor,
        string memory githubUsername,
        uint256 contributionCount
    ) external {
        require(
            repos[repoName].maintainer == msg.sender,
            "Not authorized: Not repo maintainer"
        );
        require(repos[repoName].verified, "Repo not verified");

        RewardPool pool = RewardPool(repos[repoName].pool);

        // Check if this is a new contributor
        bool isNewContributor = !pool.isContributorActive(contributor);

        // Initial AI score is 5000 (50% - neutral score)
        pool.setContributor(
            contributor,
            githubUsername,
            5000,
            contributionCount
        );

        if (isNewContributor) {
            repos[repoName].contributorCount++;
        }
    }

    // Update AI scores (called by AI model)
    function updateContributorScores(
        string memory repoName,
        address[] memory contributors,
        uint256[] memory newScores
    ) external onlyAuthorizedAI {
        require(
            contributors.length == newScores.length,
            "Arrays length mismatch"
        );
        require(repos[repoName].pool != address(0), "Repo not found");

        RewardPool pool = RewardPool(repos[repoName].pool);

        for (uint i = 0; i < contributors.length; i++) {
            pool.updateAIScore(contributors[i], newScores[i]);
            emit ContributorScoreUpdated(
                repoName,
                contributors[i],
                newScores[i]
            );
        }
    }

    // Authorize AI model addresses
    function setAIModelAuthorization(
        address aiModel,
        bool authorized
    ) external onlyOwner {
        authorizedAIModels[aiModel] = authorized;
        emit AIModelAuthorized(aiModel, authorized);
    }

    // Get repo details for frontend
    function getRepoDetails(
        string memory repoName
    )
        external
        view
        returns (
            string memory name,
            string memory githubUrl,
            address maintainer,
            address pool,
            bool verified,
            uint256 totalFunding,
            uint256 contributorCount,
            uint256 createdAt
        )
    {
        Repo memory repo = repos[repoName];
        return (
            repo.name,
            repo.githubUrl,
            repo.maintainer,
            repo.pool,
            repo.verified,
            repo.totalFunding,
            repo.contributorCount,
            repo.createdAt
        );
    }

    // Get all repos for a maintainer
    function getMaintainerRepos(
        address maintainer
    ) external view returns (string[] memory) {
        return maintainerRepos[maintainer];
    }

    // Get all repos (for discovery)
    function getAllRepos() external view returns (string[] memory) {
        return allRepos;
    }

    // Get verified repos only
    function getVerifiedRepos() external view returns (string[] memory) {
        uint256 verifiedCount = 0;

        // Count verified repos
        for (uint i = 0; i < allRepos.length; i++) {
            if (repos[allRepos[i]].verified) {
                verifiedCount++;
            }
        }

        string[] memory verifiedRepos = new string[](verifiedCount);
        uint256 index = 0;

        for (uint i = 0; i < allRepos.length; i++) {
            if (repos[allRepos[i]].verified) {
                verifiedRepos[index] = allRepos[i];
                index++;
            }
        }

        return verifiedRepos;
    }

    // Check if payments can be processed
    function canProcessPayments(
        string memory repoName
    ) external view returns (bool) {
        if (!repos[repoName].verified || repos[repoName].totalFunding == 0) {
            return false;
        }

        RewardPool pool = RewardPool(repos[repoName].pool);
        return pool.getContributorCount() > 0 && pool.getTotalAIScores() > 0;
    }

    // Get payment data for Avail SDK (main function for payments)
    function getPaymentData(
        string memory repoName,
        uint256 chainId
    ) external view returns (uint256 totalFund, PaymentData[] memory payments) {
        require(repos[repoName].verified, "Repo not verified");

        RewardPool pool = RewardPool(repos[repoName].pool);
        totalFund = pool.totalFund();

        (
            address[] memory addresses,
            uint256[] memory aiScores,
            uint256[] memory amounts,
            uint256[] memory contributionCounts,
            string[] memory githubUsernames
        ) = pool.getAllContributors();

        payments = new PaymentData[](addresses.length);

        for (uint i = 0; i < addresses.length; i++) {
            payments[i] = PaymentData({
                recipient: addresses[i],
                amount: amounts[i],
                chainId: chainId,
                githubUsername: githubUsernames[i],
                repoName: repoName,
                aiScore: aiScores[i],
                contributionCount: contributionCounts[i]
            });
        }
    }

    // Get contributor data for frontend display
    function getContributorData(
        string memory repoName
    )
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
        require(repos[repoName].pool != address(0), "Repo not found");

        RewardPool pool = RewardPool(repos[repoName].pool);
        return pool.getAllContributors();
    }
}
