use anchor_lang::prelude::*;
use crate::{state::*, constants::*, error::*};

/// Advances the protocol epoch. Called by authority for monthly pool distribution cycles.
pub fn handler(ctx: Context<AdvanceEpoch>) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_state;

    require!(
        ctx.accounts.authority.key() == protocol.authority,
        FronsciersError::Unauthorized
    );

    protocol.current_epoch += 1;

    msg!("Protocol epoch advanced to {}", protocol.current_epoch);
    Ok(())
}

#[derive(Accounts)]
pub struct AdvanceEpoch<'info> {
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    pub authority: Signer<'info>,
}
