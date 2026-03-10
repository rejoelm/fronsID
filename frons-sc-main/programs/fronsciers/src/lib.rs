use anchor_lang::prelude::*;

pub mod error;
pub mod state;
pub mod instructions;
pub mod constants;

use instructions::{
    register_user::*,
    submit_manuscript::*,
    review_manuscript::*,
    initialize_escrow::*,
    initialize_doci_registry::*,
    initialize_protocol::*,
    initialize_author_vault::*,
    mint_doci_nft::*,
    record_citation::*,
    distribute_pool::*,
    claim_earnings::*,
    advance_epoch::*,
    register_privy_user::*,
    migrate_to_privy::*,
    verify_cv::*,
};

declare_id!("28VkA76EcTTN746SxZyYT8NTte9gofeBQ2L4N8hfYPgd");

#[program]
pub mod fronsciers {
    use super::*;

    pub fn register_user(
        ctx: Context<RegisterUser>, 
        education: String
    ) -> Result<()> {
        instructions::register_user::handler(ctx, education)
    }

    pub fn submit_manuscript(
        ctx: Context<SubmitManuscript>, 
        ipfs_hash: String
    ) -> Result<()> {
        instructions::submit_manuscript::handler(ctx, ipfs_hash)
    }

    pub fn review_manuscript(
        ctx: Context<ReviewManuscript>, 
        decision: String
    ) -> Result<()> {
        instructions::review_manuscript::handler(ctx, decision)
    }

    pub fn initialize_escrow(ctx: Context<InitializeEscrow>) -> Result<()> {
        instructions::initialize_escrow::handler(ctx)
    }

    pub fn initialize_doci_registry(ctx: Context<InitializeDOCIRegistry>) -> Result<()> {
        instructions::initialize_doci_registry::handler(ctx)
    }

    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        treasury: Pubkey,
        sharing_pool: Pubkey,
        reserve: Pubkey,
    ) -> Result<()> {
        instructions::initialize_protocol::handler(ctx, treasury, sharing_pool, reserve)
    }

    pub fn initialize_author_vault(ctx: Context<InitializeAuthorVault>) -> Result<()> {
        instructions::initialize_author_vault::handler(ctx)
    }

    pub fn mint_doci_nft(
        ctx: Context<MintDOCINFT>,
        manuscript_title: String,
        manuscript_description: String,
    ) -> Result<()> {
        instructions::mint_doci_nft::handler(ctx, manuscript_title, manuscript_description)
    }

    pub fn record_citation(ctx: Context<RecordCitation>) -> Result<()> {
        instructions::record_citation::handler(ctx)
    }

    pub fn distribute_pool(
        ctx: Context<DistributePool>,
        amount: u64,
    ) -> Result<()> {
        instructions::distribute_pool::handler(ctx, amount)
    }

    pub fn claim_earnings(ctx: Context<ClaimEarnings>) -> Result<()> {
        instructions::claim_earnings::handler(ctx)
    }

    pub fn register_privy_user(
        ctx: Context<RegisterPrivyUser>,
        privy_user_id: String,
        education: String,
        academic_email: String,
        institution: String,
        validation: state::PrivyValidation,
    ) -> Result<()> {
        instructions::register_privy_user::handler(ctx, privy_user_id, education, academic_email, institution, validation)
    }

    pub fn migrate_to_privy(
        ctx: Context<MigrateToPrivy>,
        privy_user_id: String,
        embedded_wallet: Pubkey,
        academic_email: String,
        institution: String,
        validation: state::PrivyValidation,
    ) -> Result<()> {
        instructions::migrate_to_privy::handler(ctx, privy_user_id, embedded_wallet, academic_email, institution, validation)
    }

    pub fn verify_cv(
        ctx: Context<VerifyCV>,
        cv_hash: String,
        published_papers: u8,
        backend_signature: String,
    ) -> Result<()> {
        instructions::verify_cv::handler(ctx, cv_hash, published_papers, backend_signature)
    }
}
