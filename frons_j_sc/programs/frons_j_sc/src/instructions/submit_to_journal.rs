use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount};
use crate::state::*;

#[derive(Accounts)]
#[instruction(ipfs_hash: String)]
pub struct SubmitToJournal<'info> {
    #[account(mut)]
    pub journal: Account<'info, Journal>,
    
    #[account(
        init,
        payer = fee_payer,
        space = 8 + 32 + 32 + 4 + ipfs_hash.len() + 1 + 4 + (32 * 3) + 4 + (32 * 3) + 8 + 9 + 1, // Space for 3 reviewers max
        seeds = [b"article", journal.key().as_ref(), author.key().as_ref(), ipfs_hash.as_bytes()],
        bump
    )]
    pub article: Account<'info, JournalArticle>,
    
    pub author: Signer<'info>,

    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(mut)]
    pub author_usd_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub protocol_usd_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SubmitToJournal>, ipfs_hash: String) -> Result<()> {
    // 1. SPL Token Transfer for Submission Fee (USDC)
    // Validate that the fee recipient token account is owned by the Journal's authority
    // This prevents users from providing their own account as the fee destination
    require!(
        ctx.accounts.protocol_usd_account.owner == ctx.accounts.journal.authority,
        crate::error::FronsJError::Unauthorized
    );

    let submission_fee: u64 = 50_000_000;
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.author_usd_account.to_account_info(),
        to: ctx.accounts.protocol_usd_account.to_account_info(),
        authority: ctx.accounts.author.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_context, submission_fee)?;

    // 2. Journal Article Initialization
    let article = &mut ctx.accounts.article;
    article.journal_id = ctx.accounts.journal.key();
    article.author = ctx.accounts.author.key();
    article.ipfs_hash = ipfs_hash;
    article.status = ArticleStatus::Pending;
    article.reviewers = Vec::new();
    article.decisions = Vec::new();
    article.submission_time = Clock::get()?.unix_timestamp;
    article.publication_time = None;
    article.bump = ctx.bumps.article;
    
    Ok(())
}
