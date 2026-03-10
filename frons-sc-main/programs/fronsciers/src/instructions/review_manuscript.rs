use anchor_lang::prelude::*;
use crate::{state::*, constants::*, error::*};
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

pub fn handler(
  ctx: Context<ReviewManuscript>,
  decision: String,
) -> Result<()> {
  require!(decision.as_str() == "Accepted" || decision.as_str() == "Rejected", FronsciersError::InvalidDecision);

  let manuscript = &mut ctx.accounts.manuscript;
  require!(manuscript.is_pending(), FronsciersError::ManuscriptNotPending);
  require!(!manuscript.has_reviewer(&ctx.accounts.reviewer.key()), FronsciersError::ReviewerAlreadyAdded);

  manuscript.reviewers.push(ctx.accounts.reviewer.key());
  manuscript.decisions.push(decision.clone());

  let acceptance_count = manuscript.get_acceptance_count();
  let rejection_count = manuscript.get_rejection_count();

  if acceptance_count >= MIN_REVIEWS as usize {
    manuscript.status = "Accepted".to_string();

    let escrow_seeds = &[ESCROW_SEED, &[ctx.accounts.escrow.bump]];
    let signer_seeds = &[&escrow_seeds[..]];

    let cpi_accounts = MintTo {
      mint: ctx.accounts.frons_mint.to_account_info(),
      to: ctx.accounts.escrow_token_account.to_account_info(),
      authority: ctx.accounts.escrow.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer_seeds);
    token::mint_to(cpi_context, FRONS_REWARD)?;

    let total_reviewer_rewards = REVIEWER_REWARD * (manuscript.reviewers.len() as u64);
    let cpi_accounts = MintTo {
      mint: ctx.accounts.frons_mint.to_account_info(),
      to: ctx.accounts.reviewer_escrow_token_account.to_account_info(),
      authority: ctx.accounts.escrow.to_account_info(),
    };

    let cpi_context = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer_seeds);
    token::mint_to(cpi_context, total_reviewer_rewards)?;

    let cpi_accounts = Transfer {
      from: ctx.accounts.escrow_usd_account.to_account_info(),
      to: ctx.accounts.platform_usd_account.to_account_info(),
      authority: ctx.accounts.escrow.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    token::transfer(cpi_context, SUBMISSION_FEE)?;

    msg!("Manuscript accepted, rewards distributed to author and reviewers");
  } else if rejection_count >= MIN_REVIEWS as usize {
    manuscript.status = "Rejected".to_string();
    
    let escrow_seeds = &[ESCROW_SEED, &[ctx.accounts.escrow.bump]];
    let signer_seeds = &[&escrow_seeds[..]];

    let cpi_accounts = Transfer {
      from: ctx.accounts.escrow_usd_account.to_account_info(),
      to: ctx.accounts.author_usd_account.to_account_info(),
      authority: ctx.accounts.escrow.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    token::transfer(cpi_context, SUBMISSION_FEE)?;

    msg!("Manuscript rejected and fee refunded");
  }
  
  msg!("Review recorded : {} - {}", manuscript.ipfs_hash, decision);
  Ok(())
}

#[derive(Accounts)]
#[instruction(decision: String)]
pub struct ReviewManuscript<'info> {
  #[account(mut)]
  pub manuscript: Account<'info, Manuscript>,
  pub reviewer: Signer<'info>,

  #[account(mut,
  seeds = [b"user", manuscript.author.as_ref()],
  bump
  )]
  pub author: Account<'info, User>,

  #[account(mut)]
  pub escrow_usd_account: Account<'info, TokenAccount>,

  #[account(mut)]
  pub author_usd_account: Account<'info, TokenAccount>,

  #[account(mut)]
  pub platform_usd_account: Account<'info, TokenAccount>,

  #[account(mut)]
  pub frons_mint: Account<'info, Mint>,

  #[account(seeds = [ESCROW_SEED], bump)]
  pub escrow: Account<'info, EscrowAccount>,

  #[account(mut)]
  pub escrow_token_account: Account<'info, TokenAccount>,

  #[account(mut)]
  pub reviewer_escrow_token_account: Account<'info, TokenAccount>,

  pub token_program: Program<'info, Token>,
}