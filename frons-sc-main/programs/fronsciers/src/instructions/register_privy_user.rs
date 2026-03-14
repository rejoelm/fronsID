use anchor_lang::prelude::*;
use crate::{state::*, constants::*, error::*};

pub fn handler(
    ctx: Context<RegisterPrivyUser>,
    privy_user_id: String,
    education: String,
    academic_email: String,
    institution: String,
    validation: PrivyValidation,
) -> Result<()> {
    require!(
        education.as_str() == "PhD" 
        || education.as_str() == "Master" 
        || education.as_str() == "Bachelor" 
        || education.as_str() == "Doctorate",
        FronsciersError::InvalidEducationLevel
    );

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
    let embedded_wallet = ctx.accounts.embedded_wallet.key();

    // SECURITY: Validate the embedded wallet is not the zero address
    require!(
        embedded_wallet != Pubkey::default(),
        FronsciersError::MissingEmbeddedWallet
    );

    user.wallet = embedded_wallet;
    user.privy_user_id = Some(privy_user_id);
    user.embedded_wallet = Some(embedded_wallet);
    user.education = education;
    user.published_papers = 0;
    user.cv_verified = false;
    user.academic_email = Some(academic_email);
    user.created_via_privy = true;
    user.institution = Some(institution);
    user.created_at = current_time;
    user.updated_at = current_time;
    user.bump = ctx.bumps.user;

    msg!("Privy user registered successfully: {}", user.privy_user_id.as_ref().unwrap());
    msg!("Embedded wallet: {}", embedded_wallet);
    msg!("Academic email: {}", user.academic_email.as_ref().unwrap());
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(
    privy_user_id: String,
    education: String,
    academic_email: String,
    institution: String,
    validation: PrivyValidation
)]
pub struct RegisterPrivyUser<'info> {
    #[account(
        init,
        payer = payer,
        space = USER_SPACE,
        seeds = [b"user", embedded_wallet.key().as_ref()],
        bump
    )]
    pub user: Account<'info, User>,

    /// CHECK: This is the Privy-generated embedded wallet address used as PDA seed. No on-chain validation needed — the wallet key is only used to derive the user PDA seed.
    pub embedded_wallet: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}