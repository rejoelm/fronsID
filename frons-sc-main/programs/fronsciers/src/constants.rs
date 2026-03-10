pub const ESCROW_SEED: &[u8] = b"escrow";
pub const PROTOCOL_SEED: &[u8] = b"protocol";
pub const AUTHOR_VAULT_SEED: &[u8] = b"author_vault";

// ── Fees (CRITICAL: USDC on Solana has 6 decimals) ──
pub const SUBMISSION_FEE: u64 = 50_000_000;        // $50 USDC
pub const CITATION_FEE: u64 = 10_000;              // $0.01 USDC
pub const REJECTION_KEEP: u64 = 5_000_000;         // $5 kept on rejection
pub const REJECTION_REFUND: u64 = 45_000_000;      // $45 refunded on rejection

// FRONS token rewards (separate token, 9 decimals)
pub const FRONS_REWARD: u64 = 100_000_000;         // 0.1 FRONS to author
pub const REVIEWER_REWARD: u64 = 60_000_000;       // 0.06 FRONS per reviewer

pub const MIN_REVIEWS: u8 = 3;

// ── Submission fee split (BPS, total = 10000) ──
pub const PLATFORM_FEE_BPS: u16 = 4000;            // 40% → platform treasury
pub const SHARING_POOL_BPS: u16 = 3000;             // 30% → sharing pool
pub const AUTHOR_DIRECT_BPS: u16 = 1000;            // 10% → author direct
pub const PROTOCOL_RESERVE_BPS: u16 = 2000;         // 20% → protocol reserve

// ── Citation fee split (AI chat revenue) ──
pub const CHAT_PLATFORM_BPS: u16 = 4000;            // 40%
pub const CHAT_AUTHOR_BPS: u16 = 2000;              // 20%
pub const CHAT_POOL_BPS: u16 = 2000;                // 20%
pub const CHAT_RESERVE_BPS: u16 = 2000;              // 20%

// ── DOCI constants ──
pub const DOCI_REGISTRY_SEED: &[u8] = b"doci_registry";
pub const DOCI_MANUSCRIPT_SEED: &[u8] = b"doci_manuscript";
pub const CURRENT_YEAR: u16 = 2024;
pub const DOCI_PREFIX: &str = "10.fronsciers/manuscript";

// ── BPS helper ──
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Calculate amount from fee and basis points
pub fn calculate_split(total: u64, bps: u16) -> u64 {
    (total as u128 * bps as u128 / BPS_DENOMINATOR as u128) as u64
}

// ── Space calculations ──
pub const USER_SPACE: usize = 8 + // discriminator
    32 + // wallet pubkey
    4 + 64 + // privy_user_id string (max 64 chars)
    32 + // embedded_wallet pubkey
    4 + 32 + // education string (max 32 chars)
    1 + // published_papers u8
    1 + // cv_verified bool
    4 + 128 + // academic_email string (max 128 chars)
    1 + // created_via_privy bool
    4 + 128 + // institution string (max 128 chars)
    8 + // created_at i64
    8 + // updated_at i64
    1; // bump

pub const MANUSCRIPT_SPACE: usize = 8 + // discriminator
    32 + // author pubkey
    4 + 128 + // ipfs_hash string (max 128 chars)
    4 + 16 + // status string (max 16 chars)
    4 + (32 * 10) + // reviewers vec (max 10 reviewers)
    4 + (4 + 16) * 10 + // decisions vec (max 10 decisions, 16 chars each)
    8 + // submission_time
    4 + 64 + // doci string (max 64 chars)
    32 + // doci_mint pubkey
    8 + // publication_date
    1; // bump

pub const ESCROW_SPACE: usize = 8 + // discriminator
    32 + // authority
    1; // bump

pub const PROTOCOL_STATE_SPACE: usize = 8 + // discriminator
    32 + // authority
    32 + // treasury
    32 + // sharing_pool
    32 + // reserve
    8 + // total_submissions
    8 + // total_citations
    8 + // total_revenue_usdc
    8 + // current_epoch
    2 + // platform_fee_bps
    2 + // pool_fee_bps
    2 + // author_fee_bps
    2 + // reserve_fee_bps
    8 + // citation_fee
    8 + // submission_fee
    1 + // paused
    1; // bump

pub const AUTHOR_VAULT_SPACE: usize = 8 + // discriminator
    32 + // author
    8 + // total_earned
    8 + // claimable
    8 + // total_citations
    8 + // impact_score
    8 + // last_claim_epoch
    1; // bump

pub const DOCI_MANUSCRIPT_SPACE: usize = 8 + // discriminator
    4 + 64 + // doci string (max 64 chars)
    32 + // manuscript_account pubkey
    32 + // mint_address pubkey
    32 + // manuscript_hash
    4 + (32 * 10) + // authors vec (max 10 authors)
    4 + (32 * 10) + // peer_reviewers vec (max 10 reviewers)
    8 + // publication_date
    1 + // version
    4 + // citation_count
    4 + // access_count
    4 + 256 + // metadata_uri string (max 256 chars)
    8 + // royalty_config (4 u16s now)
    1; // bump

pub const DOCI_REGISTRY_SPACE: usize = 8 + // discriminator
    8 + // total_published
    2 + // current_year
    8 + // next_sequence
    32 + // authority
    1; // bump
