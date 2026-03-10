use anchor_lang::prelude::*;
use crate::{state::*, constants::*};

pub fn handler(
    ctx: Context<InitializeProtocol>,
    treasury: Pubkey,
    sharing_pool: Pubkey,
    reserve: Pubkey,
) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_state;
    
    protocol.authority = ctx.accounts.authority.key();
    protocol.treasury = treasury;
    protocol.sharing_pool = sharing_pool;
    protocol.reserve = reserve;
    protocol.total_submissions = 0;
    protocol.total_citations = 0;
    protocol.total_revenue_usdc = 0;
    protocol.current_epoch = 0;
    protocol.platform_fee_bps = PLATFORM_FEE_BPS;
    protocol.pool_fee_bps = SHARING_POOL_BPS;
    protocol.author_fee_bps = AUTHOR_DIRECT_BPS;
    protocol.reserve_fee_bps = PROTOCOL_RESERVE_BPS;
    protocol.citation_fee = CITATION_FEE;
    protocol.submission_fee = SUBMISSION_FEE;
    protocol.paused = false;
    protocol.bump = ctx.bumps.protocol_state;

    msg!("Protocol initialized — treasury: {}, pool: {}, reserve: {}", treasury, sharing_pool, reserve);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(
        init,
        payer = authority,
        space = PROTOCOL_STATE_SPACE,
        seeds = [PROTOCOL_SEED],
        bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
