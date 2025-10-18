// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./MergeFiRegistry.sol";
import "./RewardPool.sol";

/**
 * @title AvailIntegration
 * @dev Contract to interface with Avail SDK for PYUSD transfers
 * This contract provides all the data needed by Avail SDK to perform cross-chain PYUSD transfers
 */
contract AvailIntegration {
    MergeFiRegistry public registry;
    

    
    struct PaymentData {
        address recipient;
        uint256 amount;
        uint256 chainId;
        string githubUsername;
        string repoName;
        uint256 allocation; // basis points
    }
    
    event PaymentDataGenerated(string repoName, uint256 totalAmount, uint256 contributorCount);
    
    constructor(address _registryAddress) {
        registry = MergeFiRegistry(_registryAddress);
    }
    
    /**
     * @dev Get all payment data for a repository to be processed by Avail SDK
     * @param repoName The name of the repository
     * @param chainId The target chain ID for all payments
     * @return totalFund The total amount to be distributed
     * @return payments Array of payment data for each contributor
     */
    function getPaymentData(string memory repoName, uint256 chainId) 
        external 
        view 
        returns (
            uint256 totalFund,
            PaymentData[] memory payments
        ) 
    {
        (
            address poolAddress,
            uint256 totalAmount,
            address[] memory contributorAddresses,
            uint256[] memory allocations,
            uint256[] memory amounts,
            string[] memory githubUsernames
        ) = registry.getPoolDataForAvail(repoName);
        
        totalFund = totalAmount;
        payments = new PaymentData[](contributorAddresses.length);
        
        for (uint i = 0; i < contributorAddresses.length; i++) {
            payments[i] = PaymentData({
                recipient: contributorAddresses[i],
                amount: amounts[i],
                chainId: chainId,
                githubUsername: githubUsernames[i],
                repoName: repoName,
                allocation: allocations[i]
            });
        }
        
        emit PaymentDataGenerated(repoName, totalFund, contributorAddresses.length);
    }
    
    /**
     * @dev Get payment data for a specific contributor in a repository
     * @param repoName The name of the repository
     * @param contributor The address of the contributor
     * @param chainId The target chain ID for payment
     * @return payment The payment data for the contributor
     */
    function getContributorPayment(string memory repoName, address contributor, uint256 chainId) 
        external 
        view 
        returns (PaymentData memory payment) 
    {
        (, , address poolAddress, , , , , ) = registry.getRepoDetails(repoName);
        RewardPool pool = RewardPool(poolAddress);
        
        (
            address wallet,
            uint256 allocation,
            string memory githubUsername,
            bool isActive
        ) = pool.contributors(contributor);
        
        require(isActive, "Contributor not active");
        
        uint256 amount = pool.getContributorAmount(contributor);
        
        payment = PaymentData({
            recipient: wallet,
            amount: amount,
            chainId: chainId,
            githubUsername: githubUsername,
            repoName: repoName,
            allocation: allocation
        });
    }
    
    /**
     * @dev Get summary data for frontend display
     * @param repoName The name of the repository
     * @return summary Repository summary for frontend
     */
    function getRepoSummary(string memory repoName) 
        external 
        view 
        returns (
            string memory name,
            address maintainer,
            uint256 totalFund,
            uint256 contributorCount,
            uint256 totalAllocated,
            bool verified
        ) 
    {
        (
            string memory repoNameResult,
            ,
            address maintainerResult,
            address poolAddress,
            bool verifiedResult,
            uint256 totalFunding,
            uint256 contributorCountResult,
        ) = registry.getRepoDetails(repoName);
        
        RewardPool pool = RewardPool(poolAddress);
        uint256 totalAllocatedResult = pool.getTotalAllocations();
        
        return (
            repoNameResult,
            maintainerResult,
            totalFunding,
            contributorCountResult,
            totalAllocatedResult,
            verifiedResult
        );
    }
    
    /**
     * @dev Check if payments can be processed (100% allocated)
     * @param repoName The name of the repository
     * @return canProcess Whether payments can be processed
     * @return totalAllocated Total allocation percentage
     * @return remaining Remaining allocation percentage
     */
    function canProcessPayments(string memory repoName) 
        external 
        view 
        returns (
            bool canProcess,
            uint256 totalAllocated,
            uint256 remaining
        ) 
    {
        (, , , address poolAddress, , , , ) = registry.getRepoDetails(repoName);
        RewardPool pool = RewardPool(poolAddress);
        
        totalAllocated = pool.getTotalAllocations();
        remaining = pool.getRemainingAllocation();
        canProcess = (totalAllocated == 10000) && (pool.totalFund() > 0);
    }
    
    /**
     * @dev Get all repositories that are ready for payment processing
     * @return readyRepos Array of repository names ready for processing
     */
    function getReposReadyForPayment() 
        external 
        view 
        returns (string[] memory readyRepos) 
    {
        string[] memory allRepos = registry.getVerifiedRepos();
        uint256 readyCount = 0;
        
        // Count ready repos
        for (uint i = 0; i < allRepos.length; i++) {
            (bool canProcess, , ) = this.canProcessPayments(allRepos[i]);
            if (canProcess) {
                readyCount++;
            }
        }
        
        // Fill ready repos array
        readyRepos = new string[](readyCount);
        uint256 index = 0;
        
        for (uint i = 0; i < allRepos.length; i++) {
            (bool canProcess, , ) = this.canProcessPayments(allRepos[i]);
            if (canProcess) {
                readyRepos[index] = allRepos[i];
                index++;
            }
        }
    }
    

    
    /**
     * @dev Get payment data with custom chain IDs for each contributor
     * @param repoName The name of the repository
     * @param contributors Array of contributor addresses
     * @param chainIds Array of chain IDs corresponding to each contributor
     * @return totalFund The total amount to be distributed
     * @return payments Array of payment data for each contributor
     */
    function getCustomPaymentData(
        string memory repoName, 
        address[] memory contributors,
        uint256[] memory chainIds
    ) 
        external 
        view 
        returns (
            uint256 totalFund,
            PaymentData[] memory payments
        ) 
    {
        require(contributors.length == chainIds.length, "Arrays length mismatch");
        
        (, , address poolAddress, , , , , ) = registry.getRepoDetails(repoName);
        RewardPool pool = RewardPool(poolAddress);
        
        totalFund = pool.totalFund();
        payments = new PaymentData[](contributors.length);
        
        for (uint i = 0; i < contributors.length; i++) {
            (
                address wallet,
                uint256 allocation,
                string memory githubUsername,
                bool isActive
            ) = pool.contributors(contributors[i]);
            
            require(isActive, "Contributor not active");
            
            uint256 amount = pool.getContributorAmount(contributors[i]);
            
            payments[i] = PaymentData({
                recipient: wallet,
                amount: amount,
                chainId: chainIds[i],
                githubUsername: githubUsername,
                repoName: repoName,
                allocation: allocation
            });
        }
    }
    
    /**
     * @dev Get basic contributor data without chain IDs (for frontend display)
     * @param repoName The name of the repository
     * @return totalFund The total amount to be distributed
     * @return contributors Array of contributor addresses
     * @return amounts Array of amounts for each contributor
     * @return usernames Array of GitHub usernames
     * @return allocations Array of allocation percentages
     */
    function getContributorData(string memory repoName) 
        external 
        view 
        returns (
            uint256 totalFund,
            address[] memory contributors,
            uint256[] memory amounts,
            string[] memory usernames,
            uint256[] memory allocations
        ) 
    {
        (
            address poolAddress,
            uint256 totalAmount,
            address[] memory contributorAddresses,
            uint256[] memory allocationData,
            uint256[] memory amountData,
            string[] memory githubUsernames
        ) = registry.getPoolDataForAvail(repoName);
        
        return (
            totalAmount,
            contributorAddresses,
            amountData,
            githubUsernames,
            allocationData
        );
    }
}
