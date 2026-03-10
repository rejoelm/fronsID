use anchor_lang::prelude::*;
use crate::{state::*, constants::*, error::*};
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Author claims accumulated USDC earnings from their vault.
pub fn handler(
    ctx: Context<ClaimEarnings>,
) -> Result<()> {
    let protocol = &ctx.accounts.protocol_state;
    require!(protocol.is_active(), FronsciersError::ProtocolPaused);

    let author_vault = &mut ctx.accounts.author_vault;
    require!(author_vault.claimable > 0, FronsciersError::NothingToClaim);
    require!(
        ctx.accounts.author.key() == author_vault.author,
        FronsciersError::Unauthorized
    );
    
    // Ensure the author hasn't already claimed in the current epoch
    require!(
        author_vault.last_claim_epoch < protocol.current_epoch,
        FronsciersError::EpochNotReady
    );

    let claim_amount = author_vault.claimable;

    // Transfer from escrow to author's USDC account
    let escrow_seeds = &[ESCROW_SEED, &[ctx.accounts.escrow.bump]];
    let signer_seeds = &[&escrow_seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.escrow_usd_account.to_account_info(),
        to: ctx.accounts.author_usd_account.to_account_info(),
        authority: ctx.accounts.escrow.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token::transfer(cpi_context, claim_amount)?;

    // Reset claimable balance
    author_vault.claimable = 0;
    author_vault.last_claim_epoch = protocol.current_epoch;

    msg!("Author {} claimed {} USDC", author_vault.author, claim_amount);
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimEarnings<'info> {
    /// Author's vault (tracks claimable amount)
    #[account(
        mut,
        seeds = [AUTHOR_VAULT_SEED, author.key().as_ref()],
        bump = author_vault.bump
    )]
    pub author_vault: Account<'info, AuthorVault>,

    /// Protocol state (pause check)
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    /// Escrow that holds author's accumulated USDC
    #[account(
        seeds = [ESCROW_SEED],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,

    /// The author claiming earnings
    pub author: Signer<'info>,

    /// Escrow's USDC account (source)
    #[account(mut)]
    pub escrow_usd_account: Account<'info, TokenAccount>,

    /// Author's USDC account (destination)
    #[account(mut)]
    pub author_usd_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
