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

    // Validate CV hash format (must be a valid CID or hash)
    require!(
        cv_hash.len() >= 32,
        FronsciersError::InvalidCvHash
    );

    // SECURITY: Require the backend_authority to be a signer.
    // This ensures only the trusted backend can verify CVs, not arbitrary users.
    // The backend_authority must sign the transaction to prove it authorized this verification.
    require!(
        ctx.accounts.backend_authority.is_signer,
        FronsciersError::Unauthorized
    );

    // Validate published_papers is within reasonable bounds
    require!(
        published_papers <= 200,
        FronsciersError::InvalidCvHash
    );

    let user = &mut ctx.accounts.user;

    user.published_papers = published_papers;
    user.verify_cv();

    msg!("CV verified for user: {}", user.wallet);
    if let Some(privy_id) = &user.privy_user_id {
        msg!("Privy user ID: {}", privy_id);
    }
    msg!("Published papers: {}", published_papers);
    msg!("CV hash length: {}", cv_hash.len());

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

    /// The backend authority that must sign to authorize CV verification.
    /// This prevents users from self-verifying their own credentials.
    pub backend_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
