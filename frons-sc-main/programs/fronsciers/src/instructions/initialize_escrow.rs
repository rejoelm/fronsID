use anchor_lang::prelude::*;
use crate::{state::*, constants::*};

pub fn handler(ctx: Context<InitializeEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    escrow.authority = ctx.accounts.authority.key();
    escrow.bump = ctx.bumps.escrow;

    msg!("Escrow initialized with authority: {}", escrow.authority);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = authority,
        space = ESCROW_SPACE,
        seeds = [ESCROW_SEED],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}