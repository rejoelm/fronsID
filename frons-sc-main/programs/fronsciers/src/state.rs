use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PrivyValidation {
    pub user_id: String,                
    pub email: String,                  
    pub signature: String,              
    pub timestamp: i64,                
    pub cv_hash: String,               
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AcademicCredentials {
    pub institution: String,
    pub degree: String,
    pub field_of_study: String,
    pub graduation_year: u16,
    pub verified: bool,
}

#[account]
pub struct User {
  pub wallet: Pubkey,
  pub privy_user_id: Option<String>,
  pub embedded_wallet: Option<Pubkey>,
  pub education: String,
  pub published_papers: u8,
  pub cv_verified: bool,
  pub academic_email: Option<String>,
  pub created_via_privy: bool,
  pub institution: Option<String>,
  pub created_at: i64,
  pub updated_at: i64,
  pub bump: u8
}

// ── Grand Design: ManuscriptStatus enum ──
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum ManuscriptStatus {
    Pending,
    InReview,
    Accepted,
    Rejected,
    Published,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum ReviewDecision {
    Accepted,
    Rejected,
}

#[account]
pub struct Manuscript {
  pub author: Pubkey,
  pub ipfs_hash: String,
  pub status: ManuscriptStatus,
  pub reviewers: Vec<Pubkey>,
  pub decisions: Vec<ReviewDecision>,
  pub submission_time: i64,
  pub doci: Option<String>,
  pub doci_mint: Option<Pubkey>,
  pub publication_date: Option<i64>,
  pub bump: u8  
}

#[account]
pub struct EscrowAccount {
  pub authority: Pubkey,
  pub bump: u8,
}

// ── Grand Design: Protocol State ──
// Holds wallet addresses for the 4-way revenue split and global config
#[account]
pub struct ProtocolState {
    pub authority: Pubkey,           // admin who can update config
    pub treasury: Pubkey,            // platform fee wallet (40% of submissions)
    pub sharing_pool: Pubkey,        // sharing pool wallet (30% of submissions)
    pub reserve: Pubkey,             // protocol reserve wallet (20% of submissions)
    pub total_submissions: u64,
    pub total_citations: u64,
    pub total_revenue_usdc: u64,
    pub current_epoch: u64,          // for monthly pool distribution cycles
    pub platform_fee_bps: u16,
    pub pool_fee_bps: u16,
    pub author_fee_bps: u16,
    pub reserve_fee_bps: u16,
    pub citation_fee: u64,
    pub submission_fee: u64,
    pub paused: bool,
    pub bump: u8,
}

// ── Grand Design: Author Vault ──
// Per-author earnings tracker for citation revenue + pool distributions
#[account]
pub struct AuthorVault {
    pub author: Pubkey,
    pub total_earned: u64,           // lifetime USDC earned
    pub claimable: u64,              // USDC available to withdraw
    pub total_citations: u64,        // lifetime citation count
    pub impact_score: u64,           // used for pool distribution ranking
    pub last_claim_epoch: u64,       // last epoch when author claimed
    pub bump: u8,
}

// DOCI NFT Account
#[account]
pub struct DOCIManuscript {
    pub doci: String,
    pub manuscript_account: Pubkey,
    pub mint_address: Pubkey,
    pub manuscript_hash: [u8; 32],
    pub authors: Vec<Pubkey>,
    pub peer_reviewers: Vec<Pubkey>,
    pub publication_date: i64,
    pub version: u8,
    pub citation_count: u32,
    pub access_count: u32,
    pub metadata_uri: String,
    pub royalty_config: RoyaltyConfig,
    pub bump: u8
}

// Updated: 4-way royalty split matching Grand Design
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RoyaltyConfig {
    pub authors_share: u16,       // BPS — author direct
    pub platform_share: u16,      // BPS — platform treasury
    pub pool_share: u16,          // BPS — sharing pool
    pub reserve_share: u16,       // BPS — protocol reserve
}

#[account]
pub struct DOCIRegistry {
    pub total_published: u64,
    pub current_year: u16,
    pub next_sequence: u64,
    pub authority: Pubkey,
    pub bump: u8
}

impl User {
  pub fn meets_submission_requirements(&self) -> bool {
    let valid_education = matches!(self.education.as_str(), "PhD" | "Master" | "Bachelor" | "Doctorate");
    let sufficient_papers = self.published_papers >= 3;
    let cv_verified = self.cv_verified;
    
    valid_education && sufficient_papers && cv_verified
  }

  pub fn is_privy_user(&self) -> bool {
    self.created_via_privy && self.privy_user_id.is_some()
  }

  pub fn has_embedded_wallet(&self) -> bool {
    self.embedded_wallet.is_some()
  }

  pub fn get_active_wallet(&self) -> Pubkey {
    self.embedded_wallet.unwrap_or(self.wallet)
  }

  pub fn has_academic_email(&self) -> bool {
    self.academic_email.is_some()
  }

  pub fn is_academic_email_verified(&self) -> bool {
    if let Some(email) = &self.academic_email {
      let academic_domains = [".edu", ".ac.uk", ".ac.in", ".edu.au", ".ac.jp"];
      academic_domains.iter().any(|domain| email.ends_with(domain))
    } else {
      false
    }
  }

  pub fn can_be_reviewer(&self) -> bool {
    self.meets_submission_requirements() && self.is_academic_email_verified()
  }

  pub fn update_timestamp(&mut self) {
    self.updated_at = Clock::get().unwrap().unix_timestamp;
  }

  pub fn verify_cv(&mut self) {
    self.cv_verified = true;
    self.update_timestamp();
  }

  pub fn link_privy_account(&mut self, privy_user_id: String, embedded_wallet: Pubkey) {
    self.privy_user_id = Some(privy_user_id);
    self.embedded_wallet = Some(embedded_wallet);
    self.created_via_privy = true;
    self.update_timestamp();
  }
}

impl Manuscript {
  pub fn is_pending(&self) -> bool {
    self.status == ManuscriptStatus::Pending
  }

  pub fn is_accepted(&self) -> bool {
    self.status == ManuscriptStatus::Accepted
  }

  pub fn has_reviewer(&self, reviewer: &Pubkey) -> bool {
    self.reviewers.contains(reviewer)
  }

  pub fn get_acceptance_count(&self) -> usize {
    self.decisions.iter().filter(|&decision| *decision == ReviewDecision::Accepted).count()
  }

  pub fn get_rejection_count(&self) -> usize {
    self.decisions.iter().filter(|&decision| *decision == ReviewDecision::Rejected).count()
  }
}

impl DOCIRegistry {
    pub fn generate_doci(&self) -> String {
        format!("10.fronsciers/manuscript.{}.{:04}", self.current_year, self.next_sequence)
    }
}

impl ProtocolState {
    pub fn is_active(&self) -> bool {
        !self.paused
    }
}
