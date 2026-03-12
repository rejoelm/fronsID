use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::{create_metadata_accounts_v3, CreateMetadataAccountsV3, Metadata, mpl_token_metadata::types::DataV2};
use crate::{state::*, constants::*};
use sha2::{Sha256, Digest};

#[event]
pub struct DOCINFTMinted {
    pub mint: Pubkey,
    pub doci: String,
    pub title: String,
    pub description: String,
    pub ipfs_hash: String,
    pub author: Pubkey,
    pub reviewers: Vec<Pubkey>,
    pub publication_date: i64,
    pub authors_share: u16,
    pub platform_share: u16,
    pub pool_share: u16,
    pub reserve_share: u16,
}

pub fn handler(
    ctx: Context<MintDOCINFT>,
    manuscript_title: String,
    manuscript_description: String,
) -> Result<()> {
    let registry = &mut ctx.accounts.doci_registry;
    let manuscript = &mut ctx.accounts.manuscript;

    require!(manuscript.is_accepted(), crate::error::FronsciersError::ManuscriptNotAccepted);

    let doci_string = registry.generate_doci(&ctx.accounts.author.key());
    let doci = doci_string.clone();

    let mut hasher = Sha256::new();
    hasher.update(manuscript.ipfs_hash.as_bytes());
    let manuscript_hash: [u8; 32] = hasher.finalize().into();

    registry.next_sequence += 1;
    registry.total_published += 1;

    let manuscript_key = manuscript.key();
    let (_, doci_manuscript_bump) = Pubkey::find_program_address(
        &[DOCI_MANUSCRIPT_SEED, manuscript_key.as_ref()],
        ctx.program_id,
    );

    let publication_date = Clock::get()?.unix_timestamp;
    let doci_mint_key = ctx.accounts.doci_mint.key();
    let author_key = manuscript.author;
    let reviewers = manuscript.reviewers.clone();

    let doci_manuscript = &mut ctx.accounts.doci_manuscript;
    doci_manuscript.doci = doci.clone();
    doci_manuscript.manuscript_account = manuscript_key;
    doci_manuscript.mint_address = doci_mint_key;
    doci_manuscript.manuscript_hash = manuscript_hash;
    doci_manuscript.authors = vec![author_key];
    doci_manuscript.peer_reviewers = reviewers;
    doci_manuscript.publication_date = publication_date;
    doci_manuscript.version = 1;
    doci_manuscript.citation_count = 0;
    doci_manuscript.access_count = 0;
    doci_manuscript.metadata_uri = format!("https://fronsciers.com/api/manuscript/{}/metadata", doci);
    doci_manuscript.royalty_config = RoyaltyConfig {
        authors_share: AUTHOR_DIRECT_BPS,     // 10%
        platform_share: PLATFORM_FEE_BPS,     // 40%
        pool_share: SHARING_POOL_BPS,         // 30%
        reserve_share: PROTOCOL_RESERVE_BPS,  // 20%
    };
    doci_manuscript.bump = doci_manuscript_bump;

    manuscript.doci = Some(doci.clone());
    manuscript.doci_mint = Some(doci_mint_key);
    manuscript.publication_date = Some(publication_date);
    manuscript.status = ManuscriptStatus::Published;

    let authors_share = doci_manuscript.royalty_config.authors_share;
    let platform_share = doci_manuscript.royalty_config.platform_share;
    let pool_share = doci_manuscript.royalty_config.pool_share;
    let reserve_share = doci_manuscript.royalty_config.reserve_share;

    let doci_seeds = &[
        DOCI_MANUSCRIPT_SEED,
        manuscript_key.as_ref(),
        &[doci_manuscript_bump]
    ];
    let signer_seeds = &[&doci_seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.doci_mint.to_account_info(),
        to: ctx.accounts.author_token_account.to_account_info(),
        authority: ctx.accounts.doci_manuscript.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    token::mint_to(cpi_context, 1)?;

    // Metaplex CPI
    let metadata_data = DataV2 {
        name: doci.clone(), // Set NFT Name to FRONS/R-...
        symbol: String::from("DOCI"),
        uri: ctx.accounts.doci_manuscript.metadata_uri.clone(),
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    let metadata_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
            metadata: ctx.accounts.metadata_account.to_account_info(),
            mint: ctx.accounts.doci_mint.to_account_info(),
            mint_authority: ctx.accounts.doci_manuscript.to_account_info(),
            update_authority: ctx.accounts.doci_manuscript.to_account_info(),
            payer: ctx.accounts.author.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
        signer_seeds,
    );

    create_metadata_accounts_v3(
        metadata_ctx,
        metadata_data,
        true, // is_mutable
        true, // update_authority_is_signer
        None, // collection_details
    )?;

    emit!(DOCINFTMinted {
        mint: doci_mint_key,
        doci: doci.clone(),
        title: manuscript_title,
        description: manuscript_description,
        ipfs_hash: manuscript.ipfs_hash.clone(),
        author: author_key,
        reviewers: manuscript.reviewers.clone(),
        publication_date,
        authors_share,
        platform_share,
        pool_share,
        reserve_share,
    });

    msg!("DOCI NFT minted: {} for manuscript: {}", doci, manuscript.ipfs_hash);
    Ok(())
}

#[derive(Accounts)]
#[instruction(manuscript_title: String, manuscript_description: String)]
pub struct MintDOCINFT<'info> {
    #[account(mut)]
    pub manuscript: Account<'info, Manuscript>,

    #[account(
        mut,
        seeds = [DOCI_REGISTRY_SEED],
        bump
    )]
    pub doci_registry: Account<'info, DOCIRegistry>,

    #[account(
        init,
        payer = author,
        space = DOCI_MANUSCRIPT_SPACE,
        seeds = [DOCI_MANUSCRIPT_SEED, manuscript.key().as_ref()],
        bump
    )]
    pub doci_manuscript: Account<'info, DOCIManuscript>,

    #[account(
        init,
        payer = author,
        mint::decimals = 0,
        mint::authority = doci_manuscript,
        mint::freeze_authority = doci_manuscript,
    )]
    pub doci_mint: Account<'info, Mint>,

    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        init,
        payer = author,
        associated_token::mint = doci_mint,
        associated_token::authority = author,
    )]
    pub author_token_account: Account<'info, TokenAccount>,

    /// CHECK: Metaplex will validate this on protocol side
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
} 