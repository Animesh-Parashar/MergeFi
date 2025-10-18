// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTBadge is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;
    
    struct Badge {
        string repoName;
        address contributor;
        uint256 mintedAt;
        string badgeType; // "contributor", "maintainer", "verified"
    }
    
    mapping(uint256 => Badge) public badges;
    mapping(address => uint256[]) public userBadges;
    mapping(string => uint256[]) public repoBadges;
    
    event BadgeMinted(uint256 tokenId, address contributor, string repoName, string badgeType);
    
    constructor() ERC721("MergeFiBadge", "MFB") Ownable(msg.sender) {}

    function mintBadge(
        address contributor, 
        string memory repoName,
        string memory badgeType
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = tokenCounter++;
        
        _safeMint(contributor, tokenId);
        
        badges[tokenId] = Badge({
            repoName: repoName,
            contributor: contributor,
            mintedAt: block.timestamp,
            badgeType: badgeType
        });
        
        userBadges[contributor].push(tokenId);
        repoBadges[repoName].push(tokenId);
        
        emit BadgeMinted(tokenId, contributor, repoName, badgeType);
        
        return tokenId;
    }
    
    function mintBadge(address contributor, string memory repoName) external onlyOwner returns (uint256) {
        return mintBadge(contributor, repoName, "contributor");
    }
    
    // Get all badges for a user
    function getUserBadges(address user) external view returns (uint256[] memory) {
        return userBadges[user];
    }
    
    // Get all badges for a repo
    function getRepoBadges(string memory repoName) external view returns (uint256[] memory) {
        return repoBadges[repoName];
    }
    
    // Get badge details
    function getBadgeDetails(uint256 tokenId) external view returns (
        string memory repoName,
        address contributor,
        uint256 mintedAt,
        string memory badgeType
    ) {
        require(_ownerOf(tokenId) != address(0), "Badge does not exist");
        Badge memory badge = badges[tokenId];
        return (badge.repoName, badge.contributor, badge.mintedAt, badge.badgeType);
    }
    
    // Check if user has badge for specific repo
    function hasBadgeForRepo(address user, string memory repoName) external view returns (bool) {
        uint256[] memory userTokens = userBadges[user];
        for (uint i = 0; i < userTokens.length; i++) {
            if (keccak256(bytes(badges[userTokens[i]].repoName)) == keccak256(bytes(repoName))) {
                return true;
            }
        }
        return false;
    }
    
    // Set token URI for metadata
    function setTokenURI(uint256 tokenId, string memory tokenURI) external onlyOwner {
        _setTokenURI(tokenId, tokenURI);
    }
}
