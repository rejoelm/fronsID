use anchor_lang::prelude::*;
use crate::{state::*, constants::*};

pub fn handler(ctx: Context<InitializeDOCIRegistry>) -> Result<()> {
    let registry = &mut ctx.accounts.doci_registry;
    registry.total_published = 0;
    registry.current_year = CURRENT_YEAR;
    registry.next_sequence = 1;
    registry.authority = ctx.accounts.authority.key();
    registry.bump = ctx.bumps.doci_registry;

    msg!("DOCI Registry initialized for year {}", CURRENT_YEAR);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeDOCIRegistry<'info> {
    #[account(
        init,
        payer = authority,
        space = DOCI_REGISTRY_SPACE,
        seeds = [DOCI_REGISTRY_SEED],
        bump
    )]
    pub doci_registry: Account<'info, DOCIRegistry>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
} 