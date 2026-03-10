use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
#[instruction(slug: String, name: String, description: String)]
pub struct CreateJournal<'info> {
    #[account(
        init,
        payer = fee_payer,
        space = 8 + 32 + 4 + 32 + 4 + 50 + 4 + 200 + 4 + (32 * 10) + 8 + 1, // Added 4+32 for slug
        seeds = [b"journal", slug.as_bytes()],
        bump
    )]
    pub journal: Account<'info, Journal>,
    
    // The embedded wallet or normal wallet of the creator
    pub authority: Signer<'info>,

    // The account paying for the transaction (Relayer/Sponsor)
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateJournal>, slug: String, name: String, description: String) -> Result<()> {
    // Basic validation, could add specific errors later
    require!(slug.len() <= 32, FronsJError::NameTooLong);
    require!(name.len() <= 50, FronsJError::NameTooLong);
    require!(description.len() <= 200, FronsJError::DescriptionTooLong);

    let journal = &mut ctx.accounts.journal;
    journal.authority = ctx.accounts.authority.key();
    journal.slug = slug;
    journal.name = name;
    journal.description = description;
    journal.editorial_board = vec![journal.authority]; // Add creator to board initially
    journal.created_at = Clock::get()?.unix_timestamp;
    journal.bump = ctx.bumps.journal;
    
    Ok(())
}
