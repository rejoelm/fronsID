use anchor_lang::prelude::*;
use crate::{state::*, constants::*, error::*};
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Distributes accumulated sharing pool funds to an author based on impact score.
/// Called by the protocol authority during monthly distribution cycles.
pub fn handler(
    ctx: Context<DistributePool>,
    amount: u64,
) -> Result<()> {
    let protocol = &ctx.accounts.protocol_state;
    require!(protocol.is_active(), FronsciersError::ProtocolPaused);
    require!(
        ctx.accounts.authority.key() == protocol.authority,
        FronsciersError::Unauthorized
    );
    require!(amount > 0, FronsciersError::NothingToClaim);

    // Capture values before CPI to avoid borrow conflicts
    let bump = protocol.bump;
    let current_epoch = protocol.current_epoch;

    // Transfer from sharing pool to author's USDC account
    // Uses protocol PDA as signer
    let protocol_seeds = &[PROTOCOL_SEED, &[bump]];
    let signer_seeds = &[&protocol_seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.sharing_pool_usd_account.to_account_info(),
        to: ctx.accounts.author_usd_account.to_account_info(),
        authority: ctx.accounts.protocol_state.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token::transfer(cpi_context, amount)?;

    // Update author vault
    let author_vault = &mut ctx.accounts.author_vault;
    author_vault.total_earned += amount;
    author_vault.last_claim_epoch = current_epoch;

    msg!("Pool distribution: {} USDC to author {} (epoch {})",
        amount, author_vault.author, current_epoch);
    Ok(())
}

#[derive(Accounts)]
pub struct DistributePool<'info> {
    /// Protocol state (authority check + epoch tracking)
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    /// Author's vault to track earnings
    #[account(mut)]
    pub author_vault: Account<'info, AuthorVault>,

    /// Only protocol authority can distribute
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Sharing pool USDC account (source)
    #[account(mut)]
    pub sharing_pool_usd_account: Account<'info, TokenAccount>,

    /// Author's USDC account (destination)
    #[account(mut)]
    pub author_usd_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
