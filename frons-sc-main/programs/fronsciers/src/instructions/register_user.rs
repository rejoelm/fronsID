use anchor_lang::prelude::*;
use crate::{state::*, constants::*, error::*};

pub fn handler(
  ctx: Context<RegisterUser>,
  education: String,
) -> Result<()> {
  require!(education.as_str() == "PhD" || education.as_str() == "Master" || education.as_str() == "Bachelor" || education.as_str() =="Doctorate", FronsciersError::InvalidEducationLevel);

  let user = &mut ctx.accounts.user;
  let current_time = Clock::get()?.unix_timestamp;
  
  user.wallet = ctx.accounts.wallet.key();
  user.privy_user_id = None;
  user.embedded_wallet = None;
  user.education = education;
  user.published_papers = 3; //for testing, change this to retrieve from CV in the prod later
  user.cv_verified = false; // Requires CV verification
  user.academic_email = None;
  user.created_via_privy = false;
  user.institution = None;
  user.created_at = current_time;
  user.updated_at = current_time;
  user.bump = ctx.bumps.user;

  msg!("Legacy user registered successfully {}", user.wallet);
  Ok(())
}

#[derive(Accounts)]
#[instruction(education: String)]
pub struct RegisterUser<'info> {
  #[account(
    init,
    payer = wallet,
    space = USER_SPACE,
    seeds = [b"user", wallet.key().as_ref()],
    bump  
  )]
  pub user: Account<'info, User>,

  #[account(mut)]
  pub wallet: Signer<'info>,

  pub system_program: Program<'info, System>,
}