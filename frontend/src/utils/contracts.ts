import { ethers } from 'ethers';

// Contract ABIs (you'll get these after deployment)
export const MERGEFI_REGISTRY_ABI = [
    "function registerRepo(string memory repoName, string memory githubUrl) external",
    "function updateRepoFunding(string memory repoName, uint256 totalFund) external",
    "function getRepoDetails(string memory repoName) external view returns (string, string, address, address, bool, uint256, uint256, uint256)",
    "function getReposWithDetails(uint256 offset, uint256 limit) external view returns (string[], string[], address[], address[], bool[], uint256[], uint256[], uint256[])",
    "function isRepoRegistered(string memory repoName) external view returns (bool)",
    "function getAllRepos() external view returns (string[])",
    "function getVerifiedRepos() external view returns (string[])",
    "event RepoRegistered(string repoName, address maintainer, address pool, string githubUrl)",
    "event FundingUpdated(string repoName, uint256 newAmount)"
];

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
    sepolia: {
        registry: 'YOUR_SEPOLIA_REGISTRY_ADDRESS',
    },
    arbitrumSepolia: {
        registry: 'YOUR_ARBITRUM_SEPOLIA_REGISTRY_ADDRESS',
    },
};

export const NETWORKS = {
    sepolia: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia',
        rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
    arbitrumSepolia: {
        chainId: '0x66eee',
        chainName: 'Arbitrum Sepolia',
        rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://sepolia.arbiscan.io'],
    },
};

export const getProvider = () => {
    if (typeof window.ethereum !== 'undefined') {
        return new ethers.BrowserProvider(window.ethereum);
    }
    throw new Error('MetaMask not installed');
};

export const getSigner = async () => {
    const provider = getProvider();
    return await provider.getSigner();
};

export const getRegistryContract = async (network: 'sepolia' | 'arbitrumSepolia') => {
    const signer = await getSigner();
    const address = CONTRACT_ADDRESSES[network].registry;
    return new ethers.Contract(address, MERGEFI_REGISTRY_ABI, signer);
};

export const switchNetwork = async (network: 'sepolia' | 'arbitrumSepolia') => {
    const networkConfig = NETWORKS[network];

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: networkConfig.chainId }],
        });
    } catch (error: any) {
        // Network not added, add it
        if (error.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkConfig],
            });
        } else {
            throw error;
        }
    }
};

export const registerRepository = async (
    repoName: string,
    githubUrl: string,
    network: 'sepolia' | 'arbitrumSepolia' = 'sepolia'
) => {
    try {
        await switchNetwork(network);
        const contract = await getRegistryContract(network);

        const tx = await contract.registerRepo(repoName, githubUrl);
        const receipt = await tx.wait();

        return { success: true, receipt };
    } catch (error: any) {
        console.error('Error registering repository:', error);
        return { success: false, error: error.message };
    }
};

export const addFundsToRepo = async (
    repoName: string,
    amount: string,
    network: 'sepolia' | 'arbitrumSepolia' = 'sepolia'
) => {
    try {
        await switchNetwork(network);
        const contract = await getRegistryContract(network);

        const amountInWei = ethers.parseUnits(amount, 6); // PyUSD has 6 decimals
        const tx = await contract.updateRepoFunding(repoName, amountInWei);
        const receipt = await tx.wait();

        return { success: true, receipt };
    } catch (error: any) {
        console.error('Error adding funds:', error);
        return { success: false, error: error.message };
    }
};

export const isRepoRegistered = async (
    repoName: string,
    network: 'sepolia' | 'arbitrumSepolia' = 'sepolia'
) => {
    try {
        const contract = await getRegistryContract(network);
        return await contract.isRepoRegistered(repoName);
    } catch (error) {
        console.error('Error checking repo registration:', error);
        return false;
    }
};

export const getAllRegisteredRepos = async (
    network: 'sepolia' | 'arbitrumSepolia' = 'sepolia'
) => {
    try {
        const contract = await getRegistryContract(network);
        const repoNames = await contract.getAllRepos();

        // Fetch details for each repo
        const repoDetails = await Promise.all(
            repoNames.map(async (name: string) => {
                const details = await contract.getRepoDetails(name);
                return {
                    name: details[0],
                    githubUrl: details[1],
                    maintainer: details[2],
                    pool: details[3],
                    verified: details[4],
                    totalFunding: ethers.formatUnits(details[5], 6), // PyUSD has 6 decimals
                    contributorCount: details[6].toString(),
                    createdAt: new Date(Number(details[7]) * 1000).toISOString(),
                };
            })
        );

        return { success: true, repos: repoDetails };
    } catch (error: any) {
        console.error('Error fetching repos:', error);
        return { success: false, error: error.message, repos: [] };
    }
};