use anchor_lang::prelude::*;

#[account]
pub struct JournalUser {
    pub wallet: Pubkey,
    pub privy_user_id: Option<String>,
    pub embedded_wallet: Option<Pubkey>,
    pub email: Option<String>,
    pub created_via_privy: bool,
    pub created_at: i64,
    pub bump: u8
}

impl JournalUser {
    pub fn is_privy_user(&self) -> bool {
        self.created_via_privy && self.privy_user_id.is_some()
    }

    pub fn get_active_wallet(&self) -> Pubkey {
        self.embedded_wallet.unwrap_or(self.wallet)
    }
}

#[account]
pub struct Journal {
    pub authority: Pubkey,
    pub slug: String,
    pub name: String,
    pub description: String,
    pub editorial_board: Vec<Pubkey>,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum ArticleStatus {
    Pending,
    InReview,
    Accepted,
    Rejected,
    Published,
}

#[account]
pub struct JournalArticle {
    pub journal_id: Pubkey, // Maps the article to a specific Journal
    pub author: Pubkey,
    pub ipfs_hash: String,
    pub status: ArticleStatus,
    pub reviewers: Vec<Pubkey>, // Reviewers picked from the Journal's editorial board
    pub decisions: Vec<String>,
    pub submission_time: i64,
    pub publication_time: Option<i64>,
    pub bump: u8,
}

impl JournalArticle {
    pub fn is_pending(&self) -> bool {
        self.status == ArticleStatus::Pending
    }

    pub fn is_accepted(&self) -> bool {
        self.status == ArticleStatus::Accepted
    }

    pub fn get_acceptance_count(&self) -> usize {
        self.decisions.iter().filter(|&decision| decision == "Accepted").count()
    }

    pub fn get_rejection_count(&self) -> usize {
        self.decisions.iter().filter(|&decision| decision == "Rejected").count()
    }
}
