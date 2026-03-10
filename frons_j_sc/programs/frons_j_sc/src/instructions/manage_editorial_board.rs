use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
pub struct ManageEditorialBoard<'info> {
    #[account(
        mut,
        has_one = authority @ FronsJError::Unauthorized
    )]
    pub journal: Account<'info, Journal>,
    pub authority: Signer<'info>,

    #[account(mut)]
    pub fee_payer: Signer<'info>,
}

pub fn handler(ctx: Context<ManageEditorialBoard>, member: Pubkey, is_adding: bool) -> Result<()> {
    let journal = &mut ctx.accounts.journal;
    let index = journal.editorial_board.iter().position(|&m| m == member);
    
    if is_adding {
        if index.is_none() {
            journal.editorial_board.push(member);
        }
    } else {
        if let Some(i) = index {
            journal.editorial_board.remove(i);
        }
    }
    
    Ok(())
}
