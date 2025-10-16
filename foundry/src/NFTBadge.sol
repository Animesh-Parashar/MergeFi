// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTBadge is ERC721 {
    uint256 public tokenCounter;
    constructor() ERC721("CollabPayBadge", "CPB") {}

    function mintBadge(address contributor, string memory repoName) external {
        _safeMint(contributor, tokenCounter++);
    }
}
