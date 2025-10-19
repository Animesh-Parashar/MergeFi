

# MergiFi — AI-Powered Reward Pools for Open Source Contributions

**MergiFi** is a decentralized application (DApp) that empowers maintainers to create reward pools for their repositories and pay contributors for high-quality pull requests (PRs).
Payments, powered by **AI recommendations** and **maintainer approval**, are distributed in **PYUSD** with cross-chain support through **Avail**.

Contributors are rewarded not only financially, they also earn **NFT badges** for their contributions and merges, which appear publicly on the **Merged PRs Page**.

---

## 🚀 Key Features

### 💰 **AI-Driven Reward System**

* Uses AI models to recommend fair payment amounts based on PR complexity, size, and repository context.
* Maintainers can review, adjust, and approve rewards before distribution.

### 🧩 **Cross-Chain Payments via Avail**

* Leverages **Avail** for secure and scalable cross-chain interactions.
* Enables smooth PYUSD transfers to contributors across supported networks.

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
          ├── Reward Pool (PYUSD)
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
5. **PYUSD is sent** to the contributor via the Avail bridge.
6. **NFT badge** is minted for the contributor’s wallet.
7. **All transactions** are displayed on the Merged PRs page using Blockscout data.

---

## 🧱 Tech Stack

| Component           | Technology                     |
| ------------------- | ------------------------------ |
| Smart Contracts     | Solidity, Hardhat              |
| Cross-Chain Layer   | Avail                          |
| Token Standard      | ERC-20 (PYUSD)                 |
| NFTs                | ERC-721 Badges                 |
| Frontend            | React / Next.js                |
| AI Engine           | Python (OpenAI / custom model) |
| Blockchain Explorer | Blockscout                     |
| Backend             | Node.js + Express              |
| Storage             | IPFS / Pinata (for metadata)   |

---

## ⚙️ Setup & Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/pr-pool.git
cd pr-pool

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run local dev server
npm run dev
```

---

## 🔗 Environment Variables

Create a `.env` file with the following:

```bash
BLOCKSCOUT_API_URL=
AVAIL_RPC_URL=
PYUSD_CONTRACT_ADDRESS=
AI_API_KEY=
NFT_BASE_URI=
WALLET_PRIVATE_KEY=
```

---

## 🌍 Deployment

Deploy your smart contracts to a testnet or mainnet:

```bash
npx hardhat run scripts/deploy.js --network avail
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
| Maintainers  | PYUSD      | Deposit to fund reward pools           |
| Contributors | PYUSD      | Receive payment for merged PRs         |
| Contributors | NFT Badges | Earn collectible proof of contribution |

---

## 🧾 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 🌟 Roadmap

* [ ] Add GitHub OAuth integration for maintainer verification
* [ ] Expand AI models for PR valuation
* [ ] Support multiple stablecoins (USDC, DAI, etc.)
* [ ] Launch public dashboard for project rankings
* [ ] Gamify contributor badges with rarity tiers

---

## 🧠 Inspiration

PR-Pool aims to bridge **open source development** and **Web3 economics**, creating a future where contributors are **fairly rewarded**, **transparent systems** power collaboration, and **AI** helps maintainers scale community-driven projects.

