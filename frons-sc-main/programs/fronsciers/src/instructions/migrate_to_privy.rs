use anchor_lang::prelude::*;
use crate::{state::*, constants::*, error::*};

pub fn handler(
    ctx: Context<MigrateToPrivy>,
    privy_user_id: String,
    embedded_wallet: Pubkey,
    academic_email: String,
    institution: String,
    validation: PrivyValidation,
) -> Result<()> {
    require!(
        privy_user_id == validation.user_id,
        FronsciersError::InvalidPrivyValidation
    );

    require!(
        academic_email == validation.email,
        FronsciersError::InvalidAcademicEmail
    );

    let current_time = Clock::get()?.unix_timestamp;
    require!(
        (current_time - validation.timestamp).abs() < 600,
        FronsciersError::ValidationExpired
    );

    let user = &mut ctx.accounts.user;
    
    require!(
        !user.created_via_privy,
        FronsciersError::UserAlreadyMigrated
    );

    user.link_privy_account(privy_user_id, embedded_wallet);
    user.academic_email = Some(academic_email);
    user.institution = Some(institution);

    msg!("User migrated to Privy successfully");
    msg!("Legacy wallet: {}", user.wallet);
    msg!("Embedded wallet: {}", embedded_wallet);
    msg!("Privy user ID: {}", user.privy_user_id.as_ref().unwrap());
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(
    privy_user_id: String,
    embedded_wallet: Pubkey,
    academic_email: String,
    institution: String,
    validation: PrivyValidation
)]
pub struct MigrateToPrivy<'info> {
    #[account(
        mut,
        seeds = [b"user", legacy_wallet.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    #[account(mut)]
    pub legacy_wallet: Signer<'info>,

    pub system_program: Program<'info, System>,
}