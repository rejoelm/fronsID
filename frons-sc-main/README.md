# Fronsciers Smart Contract (B2C)

This Anchor program powers the **Fronsciers Decentralized Library**. It manages the on-chain lifecycle of scientific manuscripts, peer reviews, and tokenized research ownership.

## 🚀 Key Features
- **Manuscript Registry**: Anchors research metadata and Walrus blob IDs to the Solana blockchain.
- **On-Chain Peer Review**: Manages reviewer assignments and cryptographic validation of review scores.
- **DOCI NFT Minting**: Automatically mints Metaplex Token Metadata NFTs (DOCI) upon publication approval.
- **Epoch Management**: Periodically updates protocol statistics and handles reviewer rewards.

## 🛠 Tech Stack
- **Language**: Rust
- **Framework**: Anchor (SPL compatible)
- **Metadata**: Metaplex Foundation SDK

## 🏗 Setup & Build
```bash
anchor build
```
