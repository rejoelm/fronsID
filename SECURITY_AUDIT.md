# 🛡️ FRONS Ecosystem: Senior Security Audit Report

**Date:** 2026-03-12  
**Role:** Senior Web3 Auditor & Master QA  
**Scope:** Smart Contracts (Anchor), Vault Encryption, Backend (Supabase), and Gas Relayer.

---

## 🚨 Critical Findings (Immediate Action Required)

### 1. Insecure Backend Data Access (Supabase RLS)
- **Vulnerability:** The current Supabase schema (`supabase_schema.sql`) uses `FOR ALL USING (true)` for the `chat_history` and `walrus_blobs` tables.
- **Impact:** Any user can read, modify, or delete the private AI chat history and Walrus file metadata of **every other user** in the ecosystem. This is a massive privacy breach and data loss risk.
- **Recommendation:** Implement strict RLS policies that check the `wallet_address` against the authenticated user's JWT identifier (e.g., `auth.uid() == wallet_address`).

### 2. Blind-Signing Gas Relayer API
- **Vulnerability:** The relay endpoint (`frons-j-fe/src/app/api/relay/route.ts`) blindly signs any incoming Solana transaction and pays for it with the protocol's private Relayer key.
- **Impact:** An attacker can craft a transaction that drains all SOL from your Relayer wallet to their own, or uses your wallet's authority to perform unauthorized on-chain actions.
- **Recommendation:** 
  1. Add **Authentication** (e.g., verify Privy user token).
  2. Implement **Instruction Introspection**: The relayer should only sign transactions where the instruction program ID is a FRONS program and the instruction name is allowed (e.g., `submit_manuscript`).

### 3. Unprotected Protocol Configuration
- **Vulnerability:** The `protocol_config` table in Supabase has RLS enabled but uses a broad policy allowing anyone to manage keys.
- **Impact:** A malicious actor could overwrite your Supabase or Railway API keys, redirecting funds or taking over the infrastructure.
- **Recommendation:** Hardcode a "Master Admin" wallet whitelist in the Supabase policy or check for a specific `Admin` role in the `public.users` table.

---

## 🟡 High Severity Findings

### 4. Author Attribution Theft (B2C Smart Contract)
- **Vulnerability:** In `mint_doci_nft.rs`, there is no check ensuring the `Signer` is the original `manuscript.author`.
- **Impact:** An attacker can find an accepted manuscript on-chain and "steal" the DOCI NFT ownership by being the first to sign and pay for the minting transaction.
- **Recommendation:** Add `require!(manuscript.author == author.key(), FronsciersError::Unauthorized)` to the `mint_doci_nft` handler.

---

## 🔵 Medium Severity Findings

### 5. Static Cryptographic Salt (Vault)
- **Vulnerability:** `deriveKey` in `encryption.ts` uses a hardcoded salt: `"frons-vault-salt"`.
- **Impact:** If multiple users use the same password, their encryption keys will be identical, making them vulnerable to rainbow table attacks.
- **Recommendation:** Generate a unique salt per user during signup and store it in the `public.users` table.

### 6. Journal Submission Fee Bypass (B2B Smart Contract)
- **Vulnerability:** `submit_to_journal.rs` accepts an arbitrary `protocol_usd_account` from the user.
- **Impact:** A user could provide their own token account as the "recipient," effectively paying themselves the 50 USDC fee instead of the protocol.
- **Recommendation:** Use a PDA (Program Derived Address) or a verified Protocol State account to ensure fees land in the correct treasury.

---

## 🟢 Low Severity / QA Observations

### 7. String-Based Logic in B2B Reviews
- **Finding:** FRONS-J uses `String` for review decisions (`"Accepted"`) instead of the `ReviewDecision` enum used in B2C.
- **Impact:** Higher gas costs and potential for logic errors due to typos in strings.
- **Recommendation:** Unify both contracts to use the `ReviewDecision` enum.

### 8. Hardcoded B2B Fees
- **Finding:** The 50 USDC fee in `submit_to_journal` is hardcoded in the Rust handler.
- **Impact:** To change the fee, the entire program must be redeployed.
- **Recommendation:** Store `submission_fee` in the `Journal` account state.

---

## 🏆 Auditor's Final Verdict
The FRONS architecture is beautifully modular and has high technical potential. However, the **Supabase RLS** and **Relayer Security** are currently "Open Gates" that must be locked before any public testing. Addressing Findings 1, 2, and 4 should be the absolute priority for Phase 7.
