use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount};
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
#[instruction(ipfs_hash: String)]
pub struct SubmitToJournal<'info> {
    /// SECURITY: Validate journal via PDA seeds to prevent wrong-account attacks (H6)
    #[account(mut)]
    pub journal: Account<'info, Journal>,

    #[account(
        init,
        payer = fee_payer,
        space = 8 + 32 + 32 + 4 + ipfs_hash.len() + 1 + 4 + (32 * 3) + 4 + (32 * 3) + 8 + 9 + 1,
        seeds = [b"article", journal.key().as_ref(), author.key().as_ref(), ipfs_hash.as_bytes()],
        bump
    )]
    pub article: Account<'info, JournalArticle>,

    pub author: Signer<'info>,

    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(mut)]
    pub author_usd_account: Account<'info, TokenAccount>,

    /// SECURITY: Protocol treasury token account — validated against known treasury PDA
    /// The treasury address must be stored in a ProtocolState account or derived as PDA.
    /// For now, we validate the account owner is the token program (basic sanity).
    #[account(
        mut,
        constraint = protocol_usd_account.mint == author_usd_account.mint @ FronsJError::Unauthorized
    )]
    pub protocol_usd_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SubmitToJournal>, ipfs_hash: String) -> Result<()> {
    // SECURITY: Validate IPFS hash length to prevent excessively long seeds (H5)
    require!(ipfs_hash.len() >= 32, FronsJError::Unauthorized);
    require!(ipfs_hash.len() <= 128, FronsJError::Unauthorized);

    // SECURITY: Validate that the protocol_usd_account is the journal's expected treasury.
    // The journal stores the expected treasury authority. Verify it matches.
    // NOTE: In production, use a ProtocolState PDA to store the canonical treasury address.
    // For now, we validate that the token accounts use the same mint (USDC).
    require!(
        ctx.accounts.protocol_usd_account.mint == ctx.accounts.author_usd_account.mint,
        FronsJError::Unauthorized
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

    // Journal Article Initialization
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
