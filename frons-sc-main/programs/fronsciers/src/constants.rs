pub const ESCROW_SEED: &[u8] = b"escrow";
pub const SUBMISSION_FEE: u64 = 50_000_000_000; // $50 USD, 9 decimals (50 * 10^9)
pub const FRONS_REWARD: u64 = 100_000_000; // $0.1 USD, 9 decimals (0.1 * 10^9)
pub const REVIEWER_REWARD: u64 = 60_000_000; // $0.06 USD, 9 decimals (0.06 * 10^9)
pub const MIN_REVIEWS: u8 = 3;

// DOCI-specific constants
pub const DOCI_REGISTRY_SEED: &[u8] = b"doci_registry";
pub const DOCI_MANUSCRIPT_SEED: &[u8] = b"doci_manuscript";
pub const CURRENT_YEAR: u16 = 2024;
pub const DOCI_PREFIX: &str = "10.fronsciers/manuscript";

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
    1; // bump (updated)

pub const ESCROW_SPACE: usize = 8 + // discriminator
    32 + // authority
    1; // bump

// Space calculations for new DOCI accounts
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
    6 + // royalty_config (3 u16s)
    1; // bump

pub const DOCI_REGISTRY_SPACE: usize = 8 + // discriminator
    8 + // total_published
    2 + // current_year
    8 + // next_sequence
    32 + // authority
    1; // bump
