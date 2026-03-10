use anchor_lang::prelude::*;
use crate::{state::*, constants::*, error::*};
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

pub fn handler(
  ctx: Context<ReviewManuscript>,
  decision: ReviewDecision,
) -> Result<()> {
  let manuscript = &mut ctx.accounts.manuscript;
  let protocol = &mut ctx.accounts.protocol_state; // Elevated to mutable for revenue tracking
  
  require!(protocol.is_active(), FronsciersError::ProtocolPaused);
  require!(manuscript.is_pending(), FronsciersError::ManuscriptNotPending);
  require!(!manuscript.has_reviewer(&ctx.accounts.reviewer.key()), FronsciersError::ReviewerAlreadyAdded);
  
  // Strict self-review validation
  require!(ctx.accounts.reviewer.key() != manuscript.author, FronsciersError::CannotReviewOwnManuscript);

  // Validate reviewer qualifications
  require!(ctx.accounts.reviewer_user.can_be_reviewer(), FronsciersError::ReviewerNotQualified);

  manuscript.reviewers.push(ctx.accounts.reviewer.key());
  manuscript.decisions.push(decision.clone());

  let acceptance_count = manuscript.get_acceptance_count();
  let rejection_count = manuscript.get_rejection_count();

  if acceptance_count >= MIN_REVIEWS as usize {
    manuscript.status = ManuscriptStatus::Accepted;

    let escrow_seeds = &[ESCROW_SEED, &[ctx.accounts.escrow.bump]];
    let signer_seeds = &[&escrow_seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();

    // ── Grand Design: 4-way submission fee split ──
    // 40% → platform treasury
    let platform_amount = calculate_split(SUBMISSION_FEE, protocol.platform_fee_bps);
    let cpi_accounts = Transfer {
      from: ctx.accounts.escrow_usd_account.to_account_info(),
      to: ctx.accounts.treasury_usd_account.to_account_info(),
      authority: ctx.accounts.escrow.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer_seeds);
    token::transfer(cpi_context, platform_amount)?;

    // 30% → sharing pool
    let pool_amount = calculate_split(SUBMISSION_FEE, protocol.pool_fee_bps);
    let cpi_accounts = Transfer {
      from: ctx.accounts.escrow_usd_account.to_account_info(),
      to: ctx.accounts.sharing_pool_usd_account.to_account_info(),
      authority: ctx.accounts.escrow.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer_seeds);
    token::transfer(cpi_context, pool_amount)?;

    // 10% → author direct
    let author_amount = calculate_split(SUBMISSION_FEE, protocol.author_fee_bps);
    let cpi_accounts = Transfer {
      from: ctx.accounts.escrow_usd_account.to_account_info(),
      to: ctx.accounts.author_usd_account.to_account_info(),
      authority: ctx.accounts.escrow.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer_seeds);
    token::transfer(cpi_context, author_amount)?;

    // 20% → protocol reserve
    let reserve_amount = calculate_split(SUBMISSION_FEE, protocol.reserve_fee_bps);
    let cpi_accounts = Transfer {
      from: ctx.accounts.escrow_usd_account.to_account_info(),
      to: ctx.accounts.reserve_usd_account.to_account_info(),
      authority: ctx.accounts.escrow.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer_seeds);
    token::transfer(cpi_context, reserve_amount)?;

    // ── FRONS token rewards (unchanged) ──
    let cpi_accounts = MintTo {
      mint: ctx.accounts.frons_mint.to_account_info(),
      to: ctx.accounts.escrow_token_account.to_account_info(),
      authority: ctx.accounts.escrow.to_account_info(),
    };
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

    // Track protocol revenue
    protocol.total_revenue_usdc += SUBMISSION_FEE;
    
    msg!("Manuscript accepted — fee split: platform={}, pool={}, author={}, reserve={}",
      platform_amount, pool_amount, author_amount, reserve_amount);

  } else if rejection_count >= MIN_REVIEWS as usize {
    manuscript.status = ManuscriptStatus::Rejected;
    
    let escrow_seeds = &[ESCROW_SEED, &[ctx.accounts.escrow.bump]];
    let signer_seeds = &[&escrow_seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();

    // ── Grand Design: Refund $45, keep $5 ──
    // Refund $45 to author
    let cpi_accounts = Transfer {
      from: ctx.accounts.escrow_usd_account.to_account_info(),
      to: ctx.accounts.author_usd_account.to_account_info(),
      authority: ctx.accounts.escrow.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer_seeds);
    token::transfer(cpi_context, REJECTION_REFUND)?;

    // Keep $5 in treasury
    let cpi_accounts = Transfer {
      from: ctx.accounts.escrow_usd_account.to_account_info(),
      to: ctx.accounts.treasury_usd_account.to_account_info(),
      authority: ctx.accounts.escrow.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    token::transfer(cpi_context, REJECTION_KEEP)?;

    // Track protocol partial revenue ($5 kept)
    protocol.total_revenue_usdc += REJECTION_KEEP;

    msg!("Manuscript rejected — $45 refunded, $5 kept in treasury");
  }
  
  msg!("Review recorded: {} - {:?}", manuscript.ipfs_hash, decision);
  Ok(())
}

#[derive(Accounts)]
#[instruction(decision: ReviewDecision)]
pub struct ReviewManuscript<'info> {
  #[account(mut)]
  pub manuscript: Box<Account<'info, Manuscript>>,
  pub reviewer: Signer<'info>,

  /// Reviewer's user account — must pass can_be_reviewer()
  #[account(
    seeds = [b"user", reviewer.key().as_ref()],
    bump = reviewer_user.bump
  )]
  pub reviewer_user: Box<Account<'info, User>>,

  #[account(mut,
    seeds = [b"user", manuscript.author.as_ref()],
    bump
  )]
  pub author: Box<Account<'info, User>>,

  // ── Protocol state (fee config) ──
  #[account(
    seeds = [PROTOCOL_SEED],
    bump = protocol_state.bump
  )]
  pub protocol_state: Box<Account<'info, ProtocolState>>,

  // ── USDC accounts (boxed to reduce stack usage) ──
  #[account(mut)]
  pub escrow_usd_account: Box<Account<'info, TokenAccount>>,

  #[account(mut)]
  pub author_usd_account: Box<Account<'info, TokenAccount>>,

  /// Platform treasury (40% on accept, $5 on reject)
  #[account(mut)]
  pub treasury_usd_account: Box<Account<'info, TokenAccount>>,

  /// Sharing pool (30% on accept)
  #[account(mut)]
  pub sharing_pool_usd_account: Box<Account<'info, TokenAccount>>,

  /// Protocol reserve (20% on accept)
  #[account(mut)]
  pub reserve_usd_account: Box<Account<'info, TokenAccount>>,

  // ── FRONS token accounts ──
  #[account(mut)]
  pub frons_mint: Box<Account<'info, Mint>>,

  #[account(seeds = [ESCROW_SEED], bump)]
  pub escrow: Account<'info, EscrowAccount>,

  #[account(mut)]
  pub escrow_token_account: Box<Account<'info, TokenAccount>>,

  #[account(mut)]
  pub reviewer_escrow_token_account: Box<Account<'info, TokenAccount>>,

  pub token_program: Program<'info, Token>,
}