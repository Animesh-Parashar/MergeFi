import { NexusClient } from '@avail-project/nexus-sdk';

export const sdk = new NexusClient({
  appId: "YOUR_APP_ID",           // from Avail dashboard
  apiKey: "YOUR_API_KEY",         // from Avail dashboard
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com", // or any rpc
});
