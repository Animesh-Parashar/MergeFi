// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SwapRouter.sol";

contract DeploySwapRouter is Script {
    function run() external {
        // Get deployer private key from environment

        // Get chain-specific addresses
        address pyusdAddress;
        address usdcAddress;

        // Determine chain and set addresses
        if (block.chainid == 11155111) {
            // Ethereum Sepolia
            pyusdAddress = 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9;
            usdcAddress = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
        } else if (block.chainid == 421614) {
            // Arbitrum Sepolia
            pyusdAddress = 0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1;
            usdcAddress = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
        } else {
            revert("Unsupported chain");
        }

        vm.startBroadcast();

        // Deploy SwapRouter
        SwapRouter router = new SwapRouter(pyusdAddress, usdcAddress);

        console.log("SwapRouter deployed to:", address(router));
        console.log("Chain ID:", block.chainid);
        console.log("PYUSD Address:", pyusdAddress);
        console.log("USDC Address:", usdcAddress);

        vm.stopBroadcast();

        // // Save deployment info
        // string memory json = "deployments";
        // vm.serializeAddress(json, "router", address(router));
        // vm.serializeAddress(json, "pyusd", pyusdAddress);
        // vm.serializeAddress(json, "usdc", usdcAddress);
        // vm.serializeUint(json, "chainId", block.chainid);

        // string memory finalJson = vm.serializeUint(
        //     json,
        //     "blockNumber",
        //     block.number
        // );

        // string memory filename = string.concat(
        //     "deployments/",
        //     vm.toString(block.chainid),
        //     ".json"
        // );
        // vm.writeJson(finalJson, filename);
    }
}
