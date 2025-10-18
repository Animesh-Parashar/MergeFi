import { sdk } from "./avail";

async function handleBridgeAndExecute(userAddress) {
  const res = await sdk.bridgeAndExecute({
    token: "ETH",                 // now bridging native ETH
    amount: "1000000000000000000",// 1 ETH in wei (18 decimals)
    toChainId: 42161,             // Arbitrum

    execute: {
      contractAddress: "0xYourContractOnArbitrum",
      contractAbi: [ /* ABI here */ ],
      functionName: "sendPYUSD",

      buildFunctionParams: (token, amount, chainId, userAddress) => {
        return {
          functionParams: [userAddress, "1000000"], // send 1 PYUSD (6 decimals)
        };
      },

      // No tokenApproval section needed for ETH (native token doesn't need approve)
    },

    waitForReceipt: true,  // wait for full tx execution
  });

  console.log(res);
}
