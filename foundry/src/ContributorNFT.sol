// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ContributorRewardNFT is ERC721 {
    uint256 private _tokenIdCounter;

    struct ContributorReward {
        uint256 amount; // Amount paid to contributor (in wei/smallest unit)
        string repoName; // Repository name where they contributed
        string contributorName; // Contributor's name/username
        uint256 timestamp; // When the reward was given
    }

    // Mapping from token ID to contributor reward data
    mapping(uint256 => ContributorReward) public contributorRewards;

    // Mapping from contributor address to their token IDs
    mapping(address => uint256[]) public contributorTokens;

    // Events
    event RewardNFTMinted(
        uint256 indexed tokenId,
        address indexed contributor,
        uint256 amount,
        string repoName,
        string contributorName
    );

    constructor() ERC721("MergeFi Contributor Rewards", "MFCR") {}

    /**
     * @dev Mint NFT for contributor reward
     * @param contributor Address of the contributor receiving the reward
     * @param amount Amount paid to contributor
     * @param repoName Name of the repository
     * @param contributorName Name/username of the contributor
     */
    function mintRewardNFT(
        address contributor,
        uint256 amount,
        string memory repoName,
        string memory contributorName
    ) public returns (uint256) {
        require(contributor != address(0), "Invalid contributor address");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(repoName).length > 0, "Repository name cannot be empty");
        require(
            bytes(contributorName).length > 0,
            "Contributor name cannot be empty"
        );

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Store reward data
        contributorRewards[tokenId] = ContributorReward({
            amount: amount,
            repoName: repoName,
            contributorName: contributorName,
            timestamp: block.timestamp
        });

        // Add to contributor's tokens list
        contributorTokens[contributor].push(tokenId);

        // Mint the NFT
        _safeMint(contributor, tokenId);

        emit RewardNFTMinted(
            tokenId,
            contributor,
            amount,
            repoName,
            contributorName
        );

        return tokenId;
    }

    /**
     * @dev Get all token IDs owned by a contributor
     */
    function getContributorTokens(
        address contributor
    ) external view returns (uint256[] memory) {
        return contributorTokens[contributor];
    }

    /**
     * @dev Get reward data for a specific token
     */
    function getRewardData(
        uint256 tokenId
    ) external view returns (ContributorReward memory) {
        // Check existence via stored reward timestamp (set at mint); avoids calling ERC721 internals
        require(contributorRewards[tokenId].timestamp != 0, "Token does not exist");
        return contributorRewards[tokenId];
    }

    /**
     * @dev Get total number of minted rewards
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Batch mint multiple NFTs for multiple contributors
     */
    function batchMintRewardNFTs(
        address[] memory contributors,
        uint256[] memory amounts,
        string[] memory contributorNames,
        string memory repoName
    ) external returns (uint256[] memory) {
        require(
            contributors.length == amounts.length,
            "Arrays length mismatch"
        );
        require(
            contributors.length == contributorNames.length,
            "Arrays length mismatch"
        );

        uint256[] memory tokenIds = new uint256[](contributors.length);

        for (uint256 i = 0; i < contributors.length; i++) {
            tokenIds[i] = mintRewardNFT(
                contributors[i],
                amounts[i],
                repoName,
                contributorNames[i]
            );
        }

        return tokenIds;
    }
}
