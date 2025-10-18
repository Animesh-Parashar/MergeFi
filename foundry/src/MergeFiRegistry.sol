// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./RewardPool.sol";
import "./NFTBadge.sol";
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
    
    NFTBadge public nftBadge;
    mapping(string => Repo) public repos;
    mapping(address => string[]) public maintainerRepos;
    string[] public allRepos;
    
    event RepoRegistered(string repoName, address maintainer, address pool, string githubUrl);
    event RepoVerified(string repoName);
    event FundingUpdated(string repoName, uint256 newAmount);
    
    constructor() Ownable(msg.sender) {
        nftBadge = new NFTBadge();
    }

    function registerRepo(string memory repoName, string memory githubUrl) external {
        require(repos[repoName].maintainer == address(0), "Repo already registered");
        require(bytes(repoName).length > 0, "Repo name cannot be empty");
        require(bytes(githubUrl).length > 0, "GitHub URL cannot be empty");
        
        // Deploy new pool
        address pool = address(new RewardPool(msg.sender));
        
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
    function updateRepoFunding(string memory repoName, uint256 totalFund) external {
        require(repos[repoName].maintainer == msg.sender, "Not authorized: Not repo maintainer");
        
        repos[repoName].totalFunding = totalFund;
        RewardPool(repos[repoName].pool).setTotalFund(totalFund);
        
        emit FundingUpdated(repoName, totalFund);
    }
    
    // Add contributor to repo pool
    function addContributor(
        string memory repoName, 
        address contributor, 
        uint256 allocation,
        string memory githubUsername
    ) external {
        require(repos[repoName].maintainer == msg.sender, "Not authorized: Not repo maintainer");
        require(repos[repoName].verified, "Repo not verified");
        
        RewardPool pool = RewardPool(repos[repoName].pool);
        
        // Check if this is a new contributor
        bool isNewContributor = !pool.contributors(contributor).isActive;
        
        pool.setContributorAllocation(contributor, allocation, githubUsername);
        
        if (isNewContributor) {
            repos[repoName].contributorCount++;
            // Mint NFT badge for new contributor
            nftBadge.mintBadge(contributor, repoName, "contributor");
        }
    }
    
    // Get repo details for frontend
    function getRepoDetails(string memory repoName) external view returns (
        string memory name,
        string memory githubUrl,
        address maintainer,
        address pool,
        bool verified,
        uint256 totalFunding,
        uint256 contributorCount,
        uint256 createdAt
    ) {
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
    function getMaintainerRepos(address maintainer) external view returns (string[] memory) {
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
    
    // Get pool data for Avail SDK integration
    function getPoolDataForAvail(string memory repoName) external view returns (
        address poolAddress,
        uint256 totalFund,
        address[] memory contributorAddresses,
        uint256[] memory allocations,
        uint256[] memory amounts,
        string[] memory githubUsernames
    ) {
        require(repos[repoName].verified, "Repo not verified");
        
        RewardPool pool = RewardPool(repos[repoName].pool);
        poolAddress = address(pool);
        totalFund = pool.totalFund();
        
        (contributorAddresses, allocations, amounts, githubUsernames) = pool.getAllContributors();
    }
}