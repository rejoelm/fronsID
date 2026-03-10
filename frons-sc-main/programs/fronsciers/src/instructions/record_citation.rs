use anchor_lang::prelude::*;
use crate::{state::*, constants::*, error::*};
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Records an AI citation of a published manuscript.
/// Splits $0.01 USDC: 40% platform / 20% author / 20% pool / 20% reserve
pub fn handler(
    ctx: Context<RecordCitation>,
) -> Result<()> {
    let protocol = &ctx.accounts.protocol_state;
    require!(protocol.is_active(), FronsciersError::ProtocolPaused);

    // Access control: only protocol authority can record citations
    require!(
        ctx.accounts.payer.key() == protocol.authority,
        FronsciersError::Unauthorized
    );

    let doci_manuscript = &mut ctx.accounts.doci_manuscript;
    let author_vault = &mut ctx.accounts.author_vault;

    // Increment citation count
    doci_manuscript.citation_count += 1;

    let fee = protocol.citation_fee;

    // ── 4-way citation fee split ──
    // 40% → platform treasury
    let platform_amount = calculate_split(fee, CHAT_PLATFORM_BPS);
    let cpi_accounts = Transfer {
        from: ctx.accounts.payer_usd_account.to_account_info(),
        to: ctx.accounts.treasury_usd_account.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_context, platform_amount)?;

    // 20% → author direct (accumulated in author vault)
    let author_amount = calculate_split(fee, CHAT_AUTHOR_BPS);
    let cpi_accounts = Transfer {
        from: ctx.accounts.payer_usd_account.to_account_info(),
        to: ctx.accounts.author_usd_account.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_context, author_amount)?;

    // 20% → sharing pool
    let pool_amount = calculate_split(fee, CHAT_POOL_BPS);
    let cpi_accounts = Transfer {
        from: ctx.accounts.payer_usd_account.to_account_info(),
        to: ctx.accounts.sharing_pool_usd_account.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_context, pool_amount)?;

    // 20% → protocol reserve
    let reserve_amount = calculate_split(fee, CHAT_RESERVE_BPS);
    let cpi_accounts = Transfer {
        from: ctx.accounts.payer_usd_account.to_account_info(),
        to: ctx.accounts.reserve_usd_account.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_context, reserve_amount)?;

    // Update author vault earnings
    author_vault.total_earned += author_amount;
    author_vault.claimable += author_amount;
    author_vault.total_citations += 1;

    msg!("Citation recorded for DOCI {} — fee split: platform={}, author={}, pool={}, reserve={}",
        doci_manuscript.doci, platform_amount, author_amount, pool_amount, reserve_amount);
    Ok(())
}

#[derive(Accounts)]
pub struct RecordCitation<'info> {
    /// The published manuscript being cited
    #[account(mut)]
    pub doci_manuscript: Account<'info, DOCIManuscript>,

    /// Author's vault to accumulate earnings
    #[account(
        mut,
        seeds = [AUTHOR_VAULT_SEED, doci_manuscript.authors[0].as_ref()],
        bump = author_vault.bump
    )]
    pub author_vault: Account<'info, AuthorVault>,

    /// Protocol state (fee config + wallet addresses)
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    /// The AI service or user paying the citation fee
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Payer's USDC token account
    #[account(mut)]
    pub payer_usd_account: Account<'info, TokenAccount>,

    /// Author's USDC token account (receives 20%)
    #[account(mut)]
    pub author_usd_account: Account<'info, TokenAccount>,

    /// Platform treasury USDC account (receives 40%)
    #[account(mut)]
    pub treasury_usd_account: Account<'info, TokenAccount>,

    /// Sharing pool USDC account (receives 20%)
    #[account(mut)]
    pub sharing_pool_usd_account: Account<'info, TokenAccount>,

    /// Protocol reserve USDC account (receives 20%)
    #[account(mut)]
    pub reserve_usd_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
