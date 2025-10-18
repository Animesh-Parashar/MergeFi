// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTBadge is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _currentTokenId;

    // Mapping from token ID to badge metadata
    mapping(uint256 => BadgeData) public badges;

    // Mapping from contributor address to their badge count
    mapping(address => uint256) public contributorBadgeCount;

    struct BadgeData {
        address contributor;
        string repoName;
        string badgeType; // "contributor", "maintainer", "top-contributor"
        uint256 timestamp;
        string metadataURI;
    }

    event BadgeMinted(
        uint256 indexed tokenId,
        address indexed contributor,
        string repoName,
        string badgeType
    );

    constructor() ERC721("MergeFi Badge", "MFBADGE") Ownable(msg.sender) {}

    /**
     * @dev Internal function to mint a badge
     * @param contributor Address of the contributor
     * @param repoName Name of the repository
     * @param badgeType Type of badge being minted
     * @return tokenId The ID of the minted token
     */
    function _mintBadge(
        address contributor,
        string memory repoName,
        string memory badgeType
    ) internal returns (uint256) {
        require(contributor != address(0), "Invalid contributor address");
        require(bytes(repoName).length > 0, "Repository name cannot be empty");
        require(bytes(badgeType).length > 0, "Badge type cannot be empty");

        _currentTokenId++;
        uint256 tokenId = _currentTokenId;

        // Mint the NFT to the contributor
        _mint(contributor, tokenId);

        // Store badge metadata
        badges[tokenId] = BadgeData({
            contributor: contributor,
            repoName: repoName,
            badgeType: badgeType,
            timestamp: block.timestamp,
            metadataURI: _generateMetadataURI(tokenId, repoName, badgeType)
        });

        // Update contributor badge count
        contributorBadgeCount[contributor]++;

        emit BadgeMinted(tokenId, contributor, repoName, badgeType);

        return tokenId;
    }

    /**
     * @dev Mint a contributor badge
     * @param contributor Address of the contributor
     * @param repoName Name of the repository
     * @return tokenId The ID of the minted token
     */
    function mintContributorBadge(
        address contributor,
        string memory repoName
    ) external onlyOwner returns (uint256) {
        return _mintBadge(contributor, repoName, "contributor");
    }

    /**
     * @dev Mint a maintainer badge
     * @param maintainer Address of the maintainer
     * @param repoName Name of the repository
     * @return tokenId The ID of the minted token
     */
    function mintMaintainerBadge(
        address maintainer,
        string memory repoName
    ) external onlyOwner returns (uint256) {
        return _mintBadge(maintainer, repoName, "maintainer");
    }

    /**
     * @dev Mint a top contributor badge
     * @param contributor Address of the top contributor
     * @param repoName Name of the repository
     * @return tokenId The ID of the minted token
     */
    function mintTopContributorBadge(
        address contributor,
        string memory repoName
    ) external onlyOwner returns (uint256) {
        return _mintBadge(contributor, repoName, "top-contributor");
    }

    /**
     * @dev Generate metadata URI for a badge
     * @param tokenId Token ID
     * @param repoName Repository name
     * @param badgeType Type of badge
     * @return metadataURI The metadata URI
     */
    function _generateMetadataURI(
        uint256 tokenId,
        string memory repoName,
        string memory badgeType
    ) internal pure returns (string memory) {
        // In production, this would point to actual metadata
        // For now, return a placeholder
        return
            string(
                abi.encodePacked(
                    "https://api.mergefi.com/metadata/",
                    tokenId.toString(),
                    "/",
                    badgeType,
                    "/",
                    repoName
                )
            );
    }

    /**
     * @dev Get badge data for a token
     * @param tokenId Token ID to query
     * @return BadgeData struct containing all badge information
     */
    function getBadgeData(
        uint256 tokenId
    ) external view returns (BadgeData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return badges[tokenId];
    }

    /**
     * @dev Get all badge token IDs for a contributor
     * @param contributor Address of the contributor
     * @return tokenIds Array of token IDs owned by the contributor
     */
    function getContributorBadges(
        address contributor
    ) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(contributor);
        uint256[] memory tokenIds = new uint256[](balance);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= _currentTokenId; i++) {
            if (_ownerOf(i) == contributor) {
                tokenIds[currentIndex] = i;
                currentIndex++;
            }
        }

        return tokenIds;
    }

    /**
     * @dev Override tokenURI to return custom metadata
     * @param tokenId Token ID to get URI for
     * @return Token URI
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return badges[tokenId].metadataURI;
    }

    /**
     * @dev Get the current token ID counter
     * @return Current token ID
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _currentTokenId;
    }

    /**
     * @dev Check if a contributor has any badges for a specific repository
     * @param contributor Address of the contributor
     * @param repoName Name of the repository
     * @return hasBadge True if contributor has a badge for the repo
     */
    function hasRepoBadge(
        address contributor,
        string memory repoName
    ) external view returns (bool) {
        uint256 balance = balanceOf(contributor);

        for (uint256 i = 1; i <= _currentTokenId; i++) {
            if (
                _ownerOf(i) == contributor &&
                keccak256(abi.encodePacked(badges[i].repoName)) ==
                keccak256(abi.encodePacked(repoName))
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Batch mint badges for multiple contributors
     * @param contributors Array of contributor addresses
     * @param repoName Name of the repository
     * @param badgeType Type of badge to mint
     * @return tokenIds Array of minted token IDs
     */
    function batchMintBadges(
        address[] memory contributors,
        string memory repoName,
        string memory badgeType
    ) external onlyOwner returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](contributors.length);

        for (uint256 i = 0; i < contributors.length; i++) {
            tokenIds[i] = _mintBadge(contributors[i], repoName, badgeType);
        }

        return tokenIds;
    }
}
