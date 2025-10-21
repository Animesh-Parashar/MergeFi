// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/MergeFiRegistry.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        MergeFiRegistry registry = new MergeFiRegistry();

        console.log("MergeFiRegistry deployed to:", address(registry));

        vm.stopBroadcast();
    }
}
