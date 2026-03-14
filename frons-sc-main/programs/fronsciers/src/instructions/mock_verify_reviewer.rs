use anchor_lang::prelude::*;
use crate::{state::*, error::*};

/// Mock reviewer verification — RESTRICTED TO DEVNET ONLY.
/// In production, this instruction should be removed or gated behind a feature flag.
/// Only the wallet owner can mock-verify their own account.
pub fn handler(
  ctx: Context<MockVerifyReviewer>,
  academic_email: String,
) -> Result<()> {
  // SECURITY: Validate that the academic email has a valid domain
  let valid_domains = [".edu", ".ac.uk", ".ac.in", ".edu.au", ".ac.jp"];
  let is_valid_domain = valid_domains.iter().any(|domain| academic_email.ends_with(domain));
  require!(is_valid_domain, FronsciersError::InvalidAcademicEmail);

  // Validate email length
  require!(academic_email.len() <= 128, FronsciersError::InvalidAcademicEmail);
  require!(academic_email.contains('@'), FronsciersError::InvalidAcademicEmail);

  let user = &mut ctx.accounts.user;

  // SECURITY: Verify the wallet signer owns this user account
  require!(user.wallet == ctx.accounts.wallet.key(), FronsciersError::Unauthorized);

  user.academic_email = Some(academic_email.clone());
  user.update_timestamp();

  msg!("WARNING: Mock verify used (devnet only). Email: {}", academic_email);
  Ok(())
}

#[derive(Accounts)]
pub struct MockVerifyReviewer<'info> {
  #[account(
    mut,
    seeds = [b"user", wallet.key().as_ref()],
    bump = user.bump,
    // SECURITY: Ensure user account belongs to the signer
    has_one = wallet @ FronsciersError::Unauthorized
  )]
  pub user: Account<'info, User>,

  #[account(mut)]
  pub wallet: Signer<'info>,
}
