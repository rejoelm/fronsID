use anchor_lang::prelude::*;
use crate::{state::*, error::*};

pub fn handler(
  ctx: Context<MockVerifyReviewer>,
  academic_email: String,
) -> Result<()> {
  let user = &mut ctx.accounts.user;
  
  // Directly set the academic email to pass the reviewer checks for testing
  user.academic_email = Some(academic_email.clone());
  user.update_timestamp();

  msg!("Mock verified academic email for testing: {}", academic_email);
  Ok(())
}

#[derive(Accounts)]
pub struct MockVerifyReviewer<'info> {
  #[account(
    mut,
    seeds = [b"user", wallet.key().as_ref()],
    bump = user.bump
  )]
  pub user: Account<'info, User>,

  #[account(mut)]
  pub wallet: Signer<'info>,
}
