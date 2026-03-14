# FRONS Ecosystem: Comprehensive Security Audit Report

**Date:** 2026-03-14
**Auditor:** PhD-Level Web Security & Web3 Security Engineer
**Scope:** Full-stack audit — Solana smart contracts (Anchor), Supabase backend, Next.js frontends, gas relayer, Walrus storage, Privy authentication, encryption/vault, payment flows.
**Methodology:** Attacker-first (red team), then defensive architecture review. All findings verified against source code.
**Severity Scale:** CRITICAL > HIGH > MEDIUM > LOW > INFORMATIONAL

---

## Executive Summary

This project has **systemic security failures across every layer of the stack**. The combination of broken Row Level Security, a blind-signing gas relayer, hardcoded admin bypass, missing on-chain authorization checks, and exposed API keys means that **an attacker with moderate skill could drain protocol funds, impersonate any user, steal researcher credentials, and exfiltrate all private data** — today, without any zero-days.

**Total Findings: 42**
- CRITICAL: 12
- HIGH: 14
- MEDIUM: 11
- LOW: 3
- INFORMATIONAL: 2

---

## Table of Contents

1. [CRITICAL: Blind-Signing Gas Relayer (Fund Drain)](#c1)
2. [CRITICAL: No Authentication on Relayer Endpoint](#c2)
3. [CRITICAL: Hardcoded Admin Bypass](#c3)
4. [CRITICAL: Broken RLS — Users Table Exposes All Records](#c4)
5. [CRITICAL: RLS Depends on Unset App Setting](#c5)
6. [CRITICAL: Unprotected Protocol Config Table](#c6)
7. [CRITICAL: CV Verification Has No Cryptographic Signature Check](#c7)
8. [CRITICAL: Mock Reviewer Verification Has No Ownership Check](#c8)
9. [CRITICAL: Multiple Rejection Refunds Drain Escrow](#c9)
10. [CRITICAL: Treasury Address is System Program (Fee Redirect)](#c10)
11. [CRITICAL: Record Citation Panics on Empty Authors Array](#c11)
12. [CRITICAL: Hardcoded Helius RPC API Key in Source Code](#c12)
13. [HIGH: Vault Password Validation is Length-Check Only](#h1)
14. [HIGH: No Embedded Wallet Validation in Privy Registration](#h2)
15. [HIGH: Integer Overflow in Reviewer Reward Calculation](#h3)
16. [HIGH: Insufficient Epoch-Based Claim Protection](#h4)
17. [HIGH: Variable-Length PDA Seeds Allow Collision Attacks](#h5)
18. [HIGH: Journal Account Has No Seed Constraint](#h6)
19. [HIGH: Author Account Confusion in Review Manuscript](#h7)
20. [HIGH: Unauthenticated Walrus Uploads](#h8)
21. [HIGH: Review Article Mutates State Before Validation](#h9)
22. [HIGH: Journal Creation Authority Not Tied to Fee Payer](#h10)
23. [HIGH: Missing Instruction-Level Validation on Relayer](#h11)
24. [HIGH: Hardcoded Privy App ID Fallbacks](#h12)
25. [HIGH: No DOCI Manuscript Seed Validation in Record Citation](#h13)
26. [HIGH: Admin Seed Upload Has No Input Validation](#h14)
27. [MEDIUM: Weak PBKDF2 Salt Derivation](#m1)
28. [MEDIUM: PBKDF2 Iterations Below Modern Standard](#m2)
29. [MEDIUM: Payment Amount Not Cryptographically Signed](#m3)
30. [MEDIUM: Gas Sponsorship Has No Rate Limiting](#m4)
31. [MEDIUM: Bearer Token Uses Privy User ID, Not JWT](#m5)
32. [MEDIUM: Unchecked Arithmetic on Author Vault Balances](#m6)
33. [MEDIUM: No Account Closure Functions (DOS via Account Spam)](#m7)
34. [MEDIUM: No Integrity Check on Walrus Downloads](#m8)
35. [MEDIUM: Middleware Does Not Verify Privy Token Signature](#m9)
36. [MEDIUM: Missing Content-Security-Policy Header](#m10)
37. [MEDIUM: Insecure Order ID Generation (Math.random)](#m11)
38. [LOW: Supabase Dummy-Key Fallbacks Mask Configuration Errors](#l1)
39. [LOW: No Audit Logging Anywhere in the System](#l2)
40. [LOW: Deprecated Base64 Encoding Pattern in Encryption](#l3)
41. [INFO: .DS_Store Committed to Repository](#i1)
42. [INFO: Hardcoded CURRENT_YEAR: 2024 in Constants](#i2)

---

## CRITICAL Findings

<a id="c1"></a>
### C1. Blind-Signing Gas Relayer — Direct Fund Drain

**File:** `frons-j-fe/src/app/api/relay/route.ts` lines 4-64
**CVSS:** 10.0

The `/api/relay` endpoint accepts any Base64-encoded Solana transaction, deserializes it, and signs it with the protocol's private relayer keypair. The only "validation" is checking that the Frons J program ID exists somewhere in the transaction's static account keys.

```typescript
// Line 33-42: Only checks program ID EXISTS in account keys list
const programIdIndex = message.staticAccountKeys.findIndex(key =>
  key.toBase58() === "H8gA7JY5sDRQiKSV8XgzsypMQw4uzy38BaeCsLgDu6tb"
);
if (programIdIndex === -1) {
  return NextResponse.json({ error: "Unauthorized Program ID..." }, { status: 403 });
}
// Line 45: Signs ANY transaction that passes the check
transaction.sign([relayerKeypair]);
```

**Attack:** An attacker crafts a transaction that includes the Frons program ID as an account key (not as an instruction target) plus a System Program `Transfer` instruction that moves all SOL from the relayer wallet to the attacker. The check passes because the program ID is present. The relayer signs. Funds are gone.

**Impact:** Complete loss of all SOL in the relayer wallet. Potentially exploitable repeatedly if the wallet is topped up.

**Fix:** Implement full instruction introspection. Deserialize each instruction, verify the program ID is the **target** (not just an account), validate the instruction discriminator matches an allow-list (e.g., only `submit_to_journal`, `review_article`), and validate all accounts in each instruction against expected PDAs.

---

<a id="c2"></a>
### C2. No Authentication on Relayer Endpoint

**File:** `frons-j-fe/src/app/api/relay/route.ts` lines 4-10

The relay endpoint has **zero authentication**. No Privy token verification, no API key, no wallet signature, nothing. Any anonymous user on the internet can POST to this endpoint.

**Fix:** Require and verify a Privy auth token in the `Authorization` header before processing any transaction. Add rate limiting per user (e.g., 5 tx/min).

---

<a id="c3"></a>
### C3. Hardcoded Admin Bypass — Full Admin Dashboard Access

**File:** `frons-admin-main/src/app/page.tsx` lines 25-27, 37-46

```typescript
const connected = true;               // Line 26 — hardcoded
const activeWallet = "FronsMasterAdmin"; // Line 27 — hardcoded fake wallet

useEffect(() => {
  if (activeWallet) {
    setIsAdmin(true);  // Line 42 — ALWAYS TRUE
  }
}, [activeWallet]);
```

**Impact:** Anyone who navigates to the admin dashboard URL has full admin access: viewing all analytics, modifying `protocol_config` (API keys, vendor secrets), uploading AI seed data, and bypassing peer review. Combined with C6, an attacker can read and overwrite every secret the protocol stores.

**Fix:** Implement proper admin authentication. Verify Privy token, check wallet address against an on-chain or Supabase admin whitelist, and remove all hardcoded overrides.

---

<a id="c4"></a>
### C4. Broken RLS — Users Table Exposes All Records

**File:** `supabase_schema.sql` lines 44-47

```sql
CREATE POLICY "Users can insert their own record" ON public.users
  FOR INSERT WITH CHECK (true);  -- Anyone can insert anything

CREATE POLICY "Users can only view their own record" ON public.users
  FOR SELECT USING (true);  -- Name is a lie; exposes ALL records
```

**Impact:** Every wallet address, user role, and timestamp in the system is publicly readable. The INSERT policy means an attacker can create arbitrary user records, including with `role = 'Journal Admin'`, which then passes the admin RLS check on `protocol_config`.

**Attack Chain:** INSERT a user with `role = 'Journal Admin'` → satisfy the `protocol_config` admin policy → read/overwrite all API keys and protocol secrets.

**Fix:** RLS SELECT should use `auth.uid()` or a verified JWT claim. INSERT should validate `auth.uid() = wallet_address` and restrict `role` to a default value.

---

<a id="c5"></a>
### C5. RLS Depends on `current_setting('app.current_wallet_address')` — Never Set

**File:** `supabase_schema.sql` lines 49-53

```sql
CREATE POLICY "Users can manage their own chat history" ON public.chat_history
  FOR ALL USING (wallet_address = (select current_setting('app.current_wallet_address', true)));

CREATE POLICY "Users can manage their own walrus blobs" ON public.walrus_blobs
  FOR ALL USING (wallet_address = (select current_setting('app.current_wallet_address', true)));
```

All three Supabase client files (`frons-fe-main`, `frons-admin-main`, `frons-chat-main` at `src/lib/supabase.ts`) create the client with `createClient(url, anonKey)` and **never call `rpc()` to set `app.current_wallet_address`**.

**Impact:** `current_setting('app.current_wallet_address', true)` returns `NULL` or empty string. The `USING` clause evaluates as `wallet_address = NULL` which is always false in SQL. This means the policies **block all access** — or, depending on Supabase configuration, may default to **allowing all access** if the setting isn't recognized. Either way, the RLS is broken.

**Fix:** Switch to Supabase Auth-based RLS using `auth.uid()`. If custom settings are needed, use `supabase.rpc('set_wallet_context', { wallet: address })` before every query.

---

<a id="c6"></a>
### C6. Unprotected Protocol Config Table

**File:** `supabase_schema.sql` lines 90-96; `frons-admin-main/src/app/page.tsx` lines 174, 183

The `protocol_config` table stores API keys and vendor credentials in plaintext. Its RLS policy depends on C5's broken `current_setting()` mechanism **and** checks against the `public.users` table which allows arbitrary role insertion (C4).

```typescript
// Admin page — no auth, directly reads/writes config
const { data } = await supabase.from('protocol_config').select('*').order('key_name');
const { error } = await supabase.from('protocol_config').upsert({ key_name, key_value });
```

**Impact:** Full read/write access to all stored secrets. An attacker can redirect payment endpoints, swap out API keys, or inject malicious configuration values.

**Fix:** Move secrets to a proper secrets manager (AWS Secrets Manager, Doppler, Vault). If Supabase must store config, use service-role-only access from a backend function, never from the client.

---

<a id="c7"></a>
### C7. CV Verification Has No Cryptographic Signature Check

**File:** `frons-sc-main/programs/fronsciers/src/instructions/verify_cv.rs` lines 4-30

```rust
pub fn handler(
    ctx: Context<VerifyCV>,
    cv_hash: String,
    published_papers: u8,
    backend_signature: String,  // STRING — not validated cryptographically
) -> Result<()> {
    require!(!cv_hash.is_empty(), ...);
    require!(!backend_signature.is_empty(), ...);  // Just checks non-empty!
    let user = &mut ctx.accounts.user;
    user.published_papers = published_papers;  // Attacker sets any value
    user.verify_cv();
```

**Impact:** Any user can call `verify_cv` with any `published_papers` count and any non-empty string as the "signature." This grants fake academic credentials, enabling unqualified users to submit manuscripts and act as reviewers. The entire peer review integrity is broken.

**Fix:** The `backend_signature` must be a proper Ed25519 signature from a known backend authority public key. Verify it on-chain using `ed25519_program` or pass the backend authority as a `Signer<'info>`.

---

<a id="c8"></a>
### C8. Mock Reviewer Verification Has No Ownership Check

**File:** `frons-sc-main/programs/fronsciers/src/instructions/mock_verify_reviewer.rs` lines 4-15

```rust
pub fn handler(ctx: Context<MockVerifyReviewer>, academic_email: String) -> Result<()> {
    let user = &mut ctx.accounts.user;
    user.academic_email = Some(academic_email.clone());  // Sets any email for any user
```

**Impact:** Attacker can set any academic email on any user's account, granting them reviewer status. This instruction exists for testing but is deployed to production.

**Fix:** Remove this instruction entirely from production builds. If kept for devnet, add `#[cfg(feature = "devnet")]` gate and add `has_one = wallet` constraint.

---

<a id="c9"></a>
### C9. Multiple Rejection Refunds Drain Escrow

**File:** `frons-sc-main/programs/fronsciers/src/instructions/review_manuscript.rs` lines 100-130

```rust
} else if rejection_count >= MIN_REVIEWS as usize {
    manuscript.status = ManuscriptStatus::Rejected;
    // Refunds $45 from escrow to author
    token::transfer(cpi_context, REJECTION_REFUND)?;
}
```

Once `rejection_count >= 3` (MIN_REVIEWS), **every additional reviewer** triggers another $45 refund. The status is set to `Rejected` but there is no check that the manuscript was already rejected.

**Attack:** Submit a manuscript ($50 fee). Recruit 10 colluding "reviewers." Each reviewer rejects. The first 3 rejections set status to Rejected and each triggers a $45 refund. Reviewers 4-10 also trigger refunds because the check only verifies `rejection_count >= MIN_REVIEWS`, not `manuscript.status != Rejected`. Total refunded: $45 * 10 = $450 on a $50 deposit. Escrow drained.

**Fix:** Add `require!(manuscript.status == ManuscriptStatus::Pending, ...)` at the top of the review handler. Only process refund once when transitioning to Rejected.

---

<a id="c10"></a>
### C10. Treasury Address is System Program (Fee Redirect)

**File:** `frons_j_sc/programs/frons_j_sc/src/instructions/submit_to_journal.rs` line 39

```rust
let expected_treasury_authority = pubkey!("11111111111111111111111111111111");
```

This is the System Program address, not a treasury address. The comparison is effectively meaningless — it will either always pass or always fail depending on what `protocol_usd_account` is passed.

**Impact:** Submission fees (50 USDC per article) can be redirected to an attacker's token account.

**Fix:** Store the treasury address in a `ProtocolState` PDA and validate against it, or derive it as a PDA.

---

<a id="c11"></a>
### C11. Record Citation Panics on Empty Authors Array

**File:** `frons-sc-main/programs/fronsciers/src/instructions/record_citation.rs` line 91

```rust
seeds = [AUTHOR_VAULT_SEED, doci_manuscript.authors[0].as_ref()],
```

If `doci_manuscript.authors` is empty, this is an index-out-of-bounds panic, which halts the transaction. An attacker can craft a `DOCIManuscript` account with an empty authors array (if account creation allows it), causing all citation recording to permanently fail.

**Fix:** Add `require!(!doci_manuscript.authors.is_empty(), ...)` before the account derivation, or better yet, validate the DOCIManuscript via PDA seed constraints.

---

<a id="c12"></a>
### C12. Hardcoded Helius RPC API Key in Source Code

**Files:**
- `frons-fe-main/src/lib/constants/solana.ts` lines 4-6
- `frons-admin-main/src/lib/constants/solana.ts` lines 4-6
- `frons-chat-main/src/lib/constants/solana.ts` lines 4-5

```typescript
RPC_URL: "https://devnet.helius-rpc.com/?api-key=3451b7c4-f90f-451e-a4b5-c51966815b43",
```

This API key is committed to the repository and will be in every client-side JavaScript bundle. It's visible in browser DevTools, git history, and any CDN cache.

**Impact:** Rate limit abuse, impersonation of your app to Helius, potential service disruption.

**Fix:** Immediately rotate this key. Move to `NEXT_PUBLIC_HELIUS_API_KEY` environment variable. Consider proxying RPC calls through your backend to avoid exposing the key entirely.

---

## HIGH Findings

<a id="h1"></a>
### H1. Vault Password Validation is Length-Check Only

**File:** `frons-chat-main/src/app/chat/page.tsx` lines 150-154

```typescript
const handleUnlockVault = () => {
  if (secretKey.length > 3) {
    setIsKeyValid(true);  // ANY 4+ char string unlocks the vault
  }
};
```

No hash comparison, no server-side verification. The vault key is stored in React state (visible in DevTools).

**Fix:** Derive an encryption key from the password using PBKDF2/Argon2, attempt decryption of a known test blob, and only unlock if decryption succeeds.

---

<a id="h2"></a>
### H2. No Embedded Wallet Validation in Privy Registration

**File:** `frons-sc-main/programs/fronsciers/src/instructions/register_privy_user.rs` line 39, 78

```rust
user.wallet = embedded_wallet;  // Line 39 — no validation
// Line 78: embedded_wallet is UncheckedAccount<'info>
```

Attacker can register as any Privy user and claim their embedded wallet, then claim their earnings.

**Fix:** Validate that the signer controls the embedded wallet, or require the embedded wallet itself to be a signer.

---

<a id="h3"></a>
### H3. Integer Overflow in Reviewer Reward Calculation

**File:** `frons-sc-main/programs/fronsciers/src/instructions/review_manuscript.rs` line 85

```rust
let total_reviewer_rewards = REVIEWER_REWARD * (manuscript.reviewers.len() as u64);
```

With `REVIEWER_REWARD = 60_000_000` and enough reviewers, this overflows `u64`. Use `checked_mul()`.

---

<a id="h4"></a>
### H4. Insufficient Epoch-Based Claim Protection

**File:** `frons-sc-main/programs/fronsciers/src/instructions/claim_earnings.rs` lines 13-22

Only checks `last_claim_epoch < protocol.current_epoch`. If `advance_epoch` is never called, claims may be blocked forever. No check that `claimable > 0` before transferring.

---

<a id="h5"></a>
### H5. Variable-Length PDA Seeds Allow Collision Attacks

**File:** `frons_j_sc/programs/frons_j_sc/src/instructions/submit_to_journal.rs` line 15

```rust
seeds = [b"article", journal.key().as_ref(), author.key().as_ref(), ipfs_hash.as_bytes()],
```

`ipfs_hash` is user-provided and variable-length. Different hash lengths create different PDAs from the same journal/author. Hash seeds before use or enforce fixed-length.

---

<a id="h6"></a>
### H6. Journal Account Has No Seed Constraint

**File:** `frons_j_sc/programs/frons_j_sc/src/instructions/submit_to_journal.rs` line 9

```rust
pub journal: Account<'info, Journal>,  // No seeds, no constraint
```

Wrong journal account can be passed. Add `seeds = [b"journal", journal_id.as_ref()], bump`.

---

<a id="h7"></a>
### H7. Author Account Confusion in Review Manuscript

**File:** `frons-sc-main/programs/fronsciers/src/instructions/review_manuscript.rs` lines 151-152

Author account derived from `manuscript.author`, but if `manuscript.author` is attacker-controlled or corrupted, the wrong user receives token mints.

---

<a id="h8"></a>
### H8. Unauthenticated Walrus Uploads

**Files:**
- `frons-chat-main/src/utils/walrus.ts` lines 14-40
- `frons-admin-main/src/utils/walrus.ts` lines 4-16
- `frons-fe-main/src/utils/walrus.ts` lines 4-16

```typescript
const response = await fetch(url, { method: "PUT", body: data });  // No auth headers
```

Anyone can upload arbitrary data to Walrus storage — spam, malicious content, or cost-amplification attacks.

**Fix:** Proxy uploads through an authenticated backend endpoint with rate limiting and content validation.

---

<a id="h9"></a>
### H9. Review Article Mutates State Before Validation

**File:** `frons_j_sc/programs/frons_j_sc/src/instructions/review_journal_article.rs` lines 20-27

State mutation (pushing reviewers, decisions) happens **before** the `require!(article.journal_id == journal.key())` check. If the check fails, the state has already been modified (transaction will revert, but this pattern is dangerous if Anchor error handling changes or if other instructions are added).

**Fix:** Move all `require!()` checks to the top of the handler, before any state mutations.

---

<a id="h10"></a>
### H10. Journal Creation Authority Not Tied to Fee Payer

**File:** `frons_j_sc/programs/frons_j_sc/src/instructions/create_journal.rs` lines 27-42

`authority` and `fee_payer` are separate signers with no validated relationship. An attacker can trick a victim into paying for journal creation while the attacker becomes the authority.

---

<a id="h11"></a>
### H11. Missing Instruction-Level Validation on Relayer

**File:** `frons-j-fe/src/app/api/relay/route.ts` lines 33-42

The relayer only checks that the program ID exists in the static account keys. It does not validate:
- Which instructions are being executed
- What instruction discriminators are being called
- Which accounts are being passed to each instruction
- Whether the transaction contains additional non-Frons instructions

---

<a id="h12"></a>
### H12. Hardcoded Privy App ID Fallbacks

**Files:**
- `frons-chat-main/src/provider/PrivyProvider.tsx` line 6: fallback `"clk4v6m200000mh08wuz1n97m"`
- `frons-j-fe/src/app/providers.tsx` line 8: fallback `"clyt3xw9z0044r7015v80m0vw"`

If environment variables are missing, apps silently connect to development Privy instances, creating authentication confusion and potential account hijacking.

---

<a id="h13"></a>
### H13. No DOCI Manuscript Seed Validation in Record Citation

**File:** `frons-sc-main/programs/fronsciers/src/instructions/record_citation.rs` lines 84-94

```rust
#[account(mut)]
pub doci_manuscript: Account<'info, DOCIManuscript>,  // No seed constraint
```

Any account that deserializes as `DOCIManuscript` will be accepted. Attacker can pass a forged account.

---

<a id="h14"></a>
### H14. Admin Seed Upload Has No Input Validation

**File:** `frons-admin-main/src/app/page.tsx` lines 240-266

No file type verification, no file size limit, no title sanitization, no duplicate checking, no authentication (due to C3). Anyone can upload anything.

---

## MEDIUM Findings

<a id="m1"></a>
### M1. Weak PBKDF2 Salt Derivation

**File:** `frons-chat-main/src/utils/encryption.ts` lines 18-20

```typescript
const saltString = `frons-vault-${userIdentifier}`;
```

Salt is deterministic and derived from the wallet address (public information). Two users with the same password would have the same key if their identifiers collide. Use `crypto.getRandomValues()` for salt generation and store per-user.

---

<a id="m2"></a>
### M2. PBKDF2 Iterations Below Modern Standard

**File:** `frons-chat-main/src/utils/encryption.ts` line 26

100,000 iterations was adequate in 2016. NIST SP 800-132 (2025 guidance) recommends 310,000+ for SHA-256. Consider Argon2id instead.

---

<a id="m3"></a>
### M3. Payment Amount Not Cryptographically Signed

**Files:**
- `frons-fe-main/src/hooks/usePayment.ts` lines 27-31
- `frons-card-main/src/lib/payment.ts` line 24

Payment amounts are set client-side and sent to the backend without cryptographic binding. A browser-side interceptor can modify amounts.

---

<a id="m4"></a>
### M4. Gas Sponsorship Has No Rate Limiting

**Files:**
- `frons-fe-main/src/hooks/useGasSponsorship.ts` lines 34-115
- `frons-admin-main/src/hooks/useGasSponsorship.ts`

No per-user quotas, no transaction cost caps, no cooldowns. An attacker can spam thousands of sponsored transactions, draining the gas budget.

---

<a id="m5"></a>
### M5. Bearer Token Uses Privy User ID, Not JWT

**Files:**
- `frons-fe-main/src/hooks/useAcademicCardPayment.ts` line 76
- `frons-admin-main/src/hooks/useAcademicCardPayment.ts` line 76

```typescript
headers: { Authorization: `Bearer ${user.id}` }
```

`user.id` is a static, guessable Privy identifier, not a signed JWT. The backend must be validating these properly — if it just trusts the ID, any user can impersonate any other user.

---

<a id="m6"></a>
### M6. Unchecked Arithmetic on Author Vault Balances

**File:** `frons-sc-main/programs/fronsciers/src/instructions/record_citation.rs` lines 69-71

```rust
author_vault.total_earned += author_amount;
author_vault.claimable += author_amount;
author_vault.total_citations += 1;
```

No overflow checks. Use `checked_add()`. If `claimable` overflows, author loses all accumulated earnings.

---

<a id="m7"></a>
### M7. No Account Closure Functions (DOS via Account Spam)

No instruction exists to close any account type (User, Manuscript, AuthorVault, DOCIManuscript, Article, Journal). Attackers can spam account creation consuming SOL and bloating on-chain state indefinitely.

---

<a id="m8"></a>
### M8. No Integrity Check on Walrus Downloads

**File:** `frons-chat-main/src/utils/walrus.ts` lines 48-65

Data retrieved from Walrus is used directly without integrity verification. MITM can modify encrypted data before decryption. Add HMAC verification.

---

<a id="m9"></a>
### M9. Middleware Does Not Verify Privy Token Signature

**Files:**
- `frons-fe-main/src/middleware.ts` lines 16-56
- `frons-admin-main/src/middleware.ts` lines 16-56

```typescript
const definitelyAuthenticated = Boolean(cookieAuthToken);
```

Middleware only checks for **cookie existence**, not token validity. A forged or expired cookie bypasses all route protection. The JWT signature and expiry must be verified.

---

<a id="m10"></a>
### M10. Missing Content-Security-Policy Header

**File:** `frons-fe-main/next.config.js` lines 27-53

Security headers include `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, and `Permissions-Policy` — but **no `Content-Security-Policy` (CSP) header**. Without CSP, the app is more vulnerable to XSS payload injection.

**Fix:** Add a strict CSP: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.helius-rpc.com`.

---

<a id="m11"></a>
### M11. Insecure Order ID Generation

**File:** `frons-card-main/src/lib/payment.ts` line 23

```typescript
const orderId = `FRONSCIERS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

`Math.random()` is not cryptographically secure. Order IDs are predictable, enabling replay or enumeration attacks. Use `crypto.getRandomValues()`.

---

## LOW Findings

<a id="l1"></a>
### L1. Supabase Dummy-Key Fallbacks Mask Configuration Errors

**Files:** All `src/lib/supabase.ts` files

```typescript
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";
```

Silent fallback to dummy credentials means production deployments with missing env vars will fail silently rather than crashing loudly at startup.

**Fix:** Throw an error if env vars are missing.

---

<a id="l2"></a>
### L2. No Audit Logging Anywhere

No audit trail for: admin actions, config changes, failed auth attempts, seed uploads, payment events, relayer usage. Essential for incident response and compliance.

---

<a id="l3"></a>
### L3. Deprecated Base64 Encoding in Encryption Utils

**File:** `frons-chat-main/src/utils/encryption.ts` lines 126-143

Uses `String.fromCharCode()` loop for Base64 conversion. Functionally correct but slow and deprecated. Use `Buffer` or `btoa(String.fromCharCode(...new Uint8Array(buffer)))`.

---

## INFORMATIONAL

<a id="i1"></a>
### I1. .DS_Store Committed to Repository

**File:** `.DS_Store`

macOS metadata file. Add to `.gitignore`.

---

<a id="i2"></a>
### I2. Hardcoded CURRENT_YEAR: 2024

**File:** `frons-fe-main/src/lib/constants/solana.ts` line 43

```typescript
CURRENT_YEAR: 2024,
```

It's 2026. If this is used for DOI generation or epoch calculations, it will produce incorrect values.

---

## Attack Scenario: Full Chain Exploit

An attacker with moderate skill can execute this kill chain today:

1. **Gain admin access** (C3): Navigate to admin dashboard. `isAdmin` is hardcoded `true`.
2. **Read all secrets** (C6): Fetch `protocol_config` table. Obtain API keys, vendor credentials.
3. **Fake credentials** (C7, C8): Call `verify_cv` with `published_papers = 255` and any non-empty "signature." Call `mock_verify_reviewer` to grant reviewer status.
4. **Drain escrow** (C9): Submit a manuscript ($50). Create 10 sock-puppet reviewer accounts. Each rejects. 10 × $45 = $450 refunded on a $50 deposit. Repeat.
5. **Drain relayer** (C1, C2): Craft a Solana transaction with Frons program ID as an account key plus a System Transfer moving all SOL from relayer to attacker. POST to `/api/relay`. Relayer signs and sends.
6. **Steal identities** (C4): Read all wallet addresses and user data from public users table.

**Total damage: All protocol funds, all user data, all stored secrets, complete protocol compromise.**

---

## Prioritized Remediation Roadmap

### Phase 1: STOP THE BLEEDING (Do This Today)

| Priority | Action | Findings |
|----------|--------|----------|
| 1 | **Take relayer offline immediately** until auth + instruction validation is added | C1, C2, H11 |
| 2 | **Remove admin bypass** — delete hardcoded `isAdmin = true` | C3 |
| 3 | **Rotate Helius API key** | C12 |
| 4 | **Fix RLS policies** — use `auth.uid()`, not `current_setting()` | C4, C5 |
| 5 | **Lock down protocol_config** — move to service-role-only access | C6 |

### Phase 2: FIX SMART CONTRACTS (This Week)

| Priority | Action | Findings |
|----------|--------|----------|
| 6 | Add `require!(manuscript.status == Pending)` to review handler | C9 |
| 7 | Implement proper Ed25519 signature verification in `verify_cv` | C7 |
| 8 | Remove `mock_verify_reviewer` from production | C8 |
| 9 | Fix treasury address in `submit_to_journal` | C10 |
| 10 | Add bounds check on `doci_manuscript.authors` | C11 |
| 11 | Add `checked_mul()` / `checked_add()` everywhere | H3, M6 |
| 12 | Add PDA seed constraints to unconstrained accounts | H6, H13 |
| 13 | Validate embedded wallet in Privy registration | H2 |

### Phase 3: HARDEN APPLICATION LAYER (This Sprint)

| Priority | Action | Findings |
|----------|--------|----------|
| 14 | Verify Privy JWT signature in middleware | M9 |
| 15 | Add CSP header | M10 |
| 16 | Proxy Walrus uploads through authenticated backend | H8 |
| 17 | Add rate limiting to gas sponsorship | M4 |
| 18 | Fix vault password to use crypto verification | H1 |
| 19 | Increase PBKDF2 iterations / switch to Argon2id | M1, M2 |
| 20 | Replace `Math.random()` with `crypto.getRandomValues()` | M11 |
| 21 | Add integrity checks on Walrus downloads | M8 |
| 22 | Use proper JWTs for API auth, not user IDs | M5 |
| 23 | Sign payment amounts server-side | M3 |
| 24 | Remove Privy App ID hardcoded fallbacks | H12 |
| 25 | Throw on missing env vars instead of dummy fallbacks | L1 |

### Phase 4: OPERATIONAL SECURITY (Next Sprint)

| Priority | Action | Findings |
|----------|--------|----------|
| 26 | Implement audit logging | L2 |
| 27 | Add account closure instructions | M7 |
| 28 | Remove `.DS_Store` from repo | I1 |
| 29 | Fix hardcoded year constant | I2 |
| 30 | Conduct formal audit of smart contracts before mainnet | All |

---

## Conclusion

This codebase is **not ready for production or mainnet deployment**. The attack surface is enormous and the vulnerabilities are trivially exploitable. The most urgent action is taking the relayer offline and fixing the admin bypass — these two alone enable complete fund drainage.

The smart contracts need a full re-audit after fixes are applied, ideally by a professional firm (Halborn, OtterSec, Neodyme) before any mainnet deployment. The Supabase RLS needs to be rebuilt from scratch using `auth.uid()` instead of the broken `current_setting()` pattern.

**Do not deploy to mainnet until every CRITICAL and HIGH finding is resolved and verified.**

---

*End of report. All findings verified against source code at commit `f02a8de`.*
