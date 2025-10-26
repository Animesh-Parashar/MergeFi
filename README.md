

# MergeFi — AI-Powered **Cross-Chain Rewards**: Built on **Avail** for seamless cross-chain transactions.
* **Transparency**: All transactions are tracked and verified on-chain.
* Enables smooth USDC transfers to contributors across supported networks. Reward Pools for Open Source Contributions

**MergeFi** is a decentralized platform that incentivizes open-source contributions by automating rewards for merged pull requests on GitHub. 

Payments, powered by **AI recommendations** and **maintainer approval**, are distributed in **USDC** with cross-chain support through **Avail**.

Contributors are rewarded not only financially, they also earn **NFT badges** for their contributions and merges, which appear publicly on the **Merged PRs Page**.

---

## 🚀 Key Features

### 💰 **AI-Driven Reward System**

* Uses AI models to recommend fair payment amounts based on PR complexity, size, and repository context.
* Maintainers can review, adjust, and approve rewards before distribution.

### 🧩 **Cross-Chain Payments via Avail**

* Leverages **Avail** for secure and scalable cross-chain interactions.
* Enables smooth USDC transfers to contributors across supported networks.

### 🔍 **Transparent Tracking with Blockscout**

* Integrates **Blockscout** to provide a full transaction history.
* Every PR merge and payment is logged on-chain and displayed on a **Merged PRs** page.

### 🏅 **NFT Contribution Badges**

* Contributors receive **unique NFT badges** for merged PRs and project milestones.
* Each badge is verifiable on-chain, adding a gamified layer to open source contribution.

### 🛠️ **Maintainer-Friendly Pools**

* Maintainers can create and manage pools tied to specific repositories.
* Reward settings, AI model parameters, and payout limits are configurable per pool.

---

## 🏗️ Architecture Overview

```text
Maintainer Repo
    └── PR-Pool Contract (per repo)
          ├── AI Pricing Engine
          ├── Reward Pool (USDC)
          ├── Avail Bridge
          ├── NFT Badge Minting
          └── Blockscout Integration
```

---

## 💡 How It Works

1. **Maintainer creates a reward pool** for their repository.
2. **Contributors submit PRs** as usual.
3. **AI evaluates** the PR and suggests a reward amount.
4. **Maintainer approves/rejects** the AI’s recommendation.
5. **USDC is sent** to the contributor via the Avail bridge.
6. **NFT badge** is minted for the contributor’s wallet.
7. **All transactions** are displayed on the Merged PRs page using Blockscout data.

---

## 🧱 Tech Stack

| Component           | Technology                     |
| ------------------- | ------------------------------ |
| Smart Contracts     | Solidity, Foundry              |
| Cross-Chain Layer   | Avail                          |
| NFTs                | ERC-721 Badges                 |
| Frontend            | React / TypeScript             |
| AI Engine           | Gemini-API                     |
| Blockchain Explorer | Blockscout                     |
| Backend             | Node.js + Express              |
| Storage             | IPFS / Pinata (for metadata)   |

---

## ⚙️ Setup & Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/MergeFi.git
cd MergeFi

# Install dependencies
npm install

# Compile contracts
forge build

# Run local dev server
npm run dev
```

---

## 🔗 Environment Variables

Create a `.env` file with the following:

```bash
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FRONTEND_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
PRIVATE_KEY=
SEPOLIA_RPC_URL=
ARBITRUM_SEPOLIA_RPC_URL=
SEPOLIA_ROUTER_ADDRESS=
ARBITRUM_ROUTER_ADDRESS=
GEMINI_API_KEY=
```

---

## 🌍 Deployment

Deploy your smart contracts to a testnet or mainnet:

```bash
forge script script/Deploy.s.sol --rpc-url <NETWORK_RPC_URL> --broadcast
```

---

## 🧑‍💻 Contributing

We welcome contributions!

1. Fork the repo
2. Create a new branch (`feat/awesome-feature`)
3. Commit and push your changes
4. Open a PR — rewards await 🎉

---

## 🪙 Tokenomics

| Role         | Token      | Purpose                                |
| ------------ | ---------- | -------------------------------------- |
| Maintainers  | USDC       | Deposit to fund reward pools           |
| Contributors | USDC       | Receive payment for merged PRs         |
| Contributors | NFT Badges | Earn collectible proof of contribution |

---

## 🧾 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 🌟 Roadmap

* [x] Add GitHub OAuth integration for maintainer verification
* [x] Expand AI models for PR valuation
* [x] Launch public dashboard for project rankings
* [x] Gamify contributor badges with rarity tiers

---

## 🧠 Inspiration

PR-Pool aims to bridge **open source development** and **Web3 economics**, creating a future where contributors are **fairly rewarded**, **transparent systems** power collaboration, and **AI** helps maintainers scale community-driven projects.

