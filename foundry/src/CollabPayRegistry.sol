// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./RewardPool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollabPayRegistry is Ownable {
    struct Repo {
        string name;
        address maintainer;
        address pool;
        bool verified;
    }
    
    constructor() Ownable(msg.sender) {}

    mapping(string => Repo) public repos;

    event RepoRegistered(string repoName, address maintainer, address pool);
    event RepoVerified(string repoName);

    function registerRepo(string memory repoName) external {
        // Check if repo already exists
        require(repos[repoName].maintainer == address(0), "Repo already registered");
        require(bytes(repoName).length > 0, "Repo name cannot be empty");
        
        // Deploy new pool
        address pool = address(new RewardPool(msg.sender));
        
        // Store repo info
        repos[repoName] = Repo({
            name: repoName,
            maintainer: msg.sender,
            pool: pool,
            verified: false
        });
        
        emit RepoRegistered(repoName, msg.sender, pool);
    }
    
    function verifyRepo(string memory repoName) external onlyOwner {
        require(repos[repoName].maintainer != address(0), "Repo not found");
        require(!repos[repoName].verified, "Repo already verified");
        
        repos[repoName].verified = true;
        emit RepoVerified(repoName);
    }
}