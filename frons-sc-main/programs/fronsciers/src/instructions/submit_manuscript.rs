use anchor_lang::prelude::*;
use crate::{state::*, constants::*, error::*};
use anchor_spl::token::{self, Transfer, Token, TokenAccount};

pub fn handler(
  ctx: Context<SubmitManuscript>,
  ipfs_hash: String,
) -> Result<()> {
  require!(!ipfs_hash.is_empty(), FronsciersError::MissingIpfsHash);
  require!(ctx.accounts.user.meets_submission_requirements(), FronsciersError::SubmissionRequirementsNotMet);

  let manuscript = &mut ctx.accounts.manuscript;
  let user = &ctx.accounts.user;
  
  manuscript.author = user.get_active_wallet();
  manuscript.ipfs_hash = ipfs_hash;
  manuscript.status = "Pending".to_string();
  manuscript.reviewers = vec![];
  manuscript.decisions = vec![];
  manuscript.submission_time = Clock::get()?.unix_timestamp;

  //cpi = cross program invocation (escrow)
  let cpi_accounts = Transfer {
    from: ctx.accounts.author_usd_account.to_account_info(),
    to: ctx.accounts.escrow_usd_account.to_account_info(),
    authority: ctx.accounts.author.to_account_info(),
  };
  let cpi_program = ctx.accounts.token_program.to_account_info();
  let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
  token::transfer(cpi_context, SUBMISSION_FEE)?;
  
  msg!("Manuscript submitted successfully {}", manuscript.ipfs_hash);
  Ok(())
}

#[derive(Accounts)]
#[instruction(ipfs_hash: String)]
pub struct SubmitManuscript<'info> {
    #[account(
        init,
        payer = author,
        space = MANUSCRIPT_SPACE
    )]
    pub manuscript: Account<'info, Manuscript>,
    
    #[account(
        seeds = [b"user", author.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,
    
    #[account(mut)]
    pub author: Signer<'info>,
    
    #[account(mut)]
    pub author_usd_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub escrow_usd_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [ESCROW_SEED],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
