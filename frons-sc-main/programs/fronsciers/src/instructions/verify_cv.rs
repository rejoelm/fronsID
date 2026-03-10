use anchor_lang::prelude::*;
use crate::{state::*, constants::*, error::*};

pub fn handler(
    ctx: Context<VerifyCV>,
    cv_hash: String,
    published_papers: u8,
    backend_signature: String,
) -> Result<()> {
    require!(!cv_hash.is_empty(), FronsciersError::MissingCvHash);
    require!(!backend_signature.is_empty(), FronsciersError::MissingBackendSignature);

    let user = &mut ctx.accounts.user;

    require!(
        cv_hash.len() >= 32,
        FronsciersError::InvalidCvHash
    );

    user.published_papers = published_papers;
    user.verify_cv();

    msg!("CV verified for user: {}", user.wallet);
    if let Some(privy_id) = &user.privy_user_id {
        msg!("Privy user ID: {}", privy_id);
    }
    msg!("Published papers: {}", published_papers);
    msg!("CV hash: {}", cv_hash);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(cv_hash: String, published_papers: u8, backend_signature: String)]
pub struct VerifyCV<'info> {
    #[account(
        mut,
        seeds = [b"user", user_wallet.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    /// CHECK: The wallet address that was used to derive the user PDA seed. Only used for seed derivation.
    pub user_wallet: UncheckedAccount<'info>,

    /// CHECK: The backend authority that signed the CV verification. Signature is validated off-chain.
    pub backend_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}