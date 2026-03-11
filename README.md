# FRONS Ecosystem Monorepo

Welcome to the FRONS Ecosystem, a comprehensive suite of Web3 applications and smart contracts revolutionizing scientific research, peer review, and academic publishing on the Solana blockchain.

## 📁 Repository Structure

This repository is organized into distinct, human-readable modules. Each folder operates as an independent application or smart contract, cleanly separating concerns across the ecosystem:

### 1. Fronsciers Library (B2C Publishing)
- **`/frons-fe-main`**: The primary frontend for Fronsciers. A decentralized library where independent researchers can submit manuscripts, undergo peer review, and publish their findings on-chain.
- **`/frons-sc-main`**: The Solana smart contract (Anchor program) powering the B2C Fronsciers library, handling manuscript states, epochs, and DOCI NFT minting.

### 2. FRONS-J (B2B Journal Management)
- **`/frons-j-fe`**: The Next.js frontend for FRONS-J ("Shopify for Journals"). An OJS-compatible journal management system allowing academic institutions to create and manage their own decentralized journals.
- **`/frons_j_sc`**: The specialized Solana smart contract enabling private editorial boards, B2B submission flows, and institutional peer review.

### 3. FRONS Vault & AI Chat (Advanced Features)
- **`/frons-chat-main`**: A dedicated, advanced frontend housing the **My Vault** and **AI Chat** features. Offers client-side AES-256-GCM encryption for private research data, Walrus network integration, and an "Evidence Cascade" AI assistant for querying public and private research contexts, fully integrated with Privy gasless transactions and real-time USDC credit balances.

### 4. FRONS Profile Cards (NFC)
- **`/frons-card-main`**: The public-facing profile application linked to physical FRONS NFC cards. Displays beautiful, LinkedIn-style verified academic resumes, dynamically fetching on-chain publications and Soulbound verification badges.

## 🔐 Web3 Integration & Authentication
Across all frontends (`frons-fe-main`, `frons-j-fe`, `frons-chat-main`), user authentication is seamlessly unified using **Privy**. Researchers can connect via Email, Google, or native Solana wallets, with their identity and real-time USDC credit balances explicitly synchronized across the entire ecosystem.

## 🚀 Getting Started

To run any of the frontend modules locally:

```bash
# Example: Running the AI Chat & Vault application
cd frons-chat-main
npm install
npm run dev
```

Ensure your `.env.local` files for each frontend explicitly carry the correct `NEXT_PUBLIC_PRIVY_APP_ID` for authentication continuity.
