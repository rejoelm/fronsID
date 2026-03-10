use anchor_lang::prelude::*;
use crate::{state::*, constants::*};

/// Initializes an AuthorVault PDA for a published author.
/// Must be called after the author's first manuscript is published.
pub fn handler(
    ctx: Context<InitializeAuthorVault>,
) -> Result<()> {
    let vault = &mut ctx.accounts.author_vault;

    vault.author = ctx.accounts.author.key();
    vault.total_earned = 0;
    vault.claimable = 0;
    vault.total_citations = 0;
    vault.impact_score = 0;
    vault.last_claim_epoch = 0;
    vault.bump = ctx.bumps.author_vault;

    msg!("Author vault initialized for {}", vault.author);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeAuthorVault<'info> {
    #[account(
        init,
        payer = author,
        space = AUTHOR_VAULT_SPACE,
        seeds = [AUTHOR_VAULT_SEED, author.key().as_ref()],
        bump
    )]
    pub author_vault: Account<'info, AuthorVault>,

    #[account(mut)]
    pub author: Signer<'info>,

    pub system_program: Program<'info, System>,
}
