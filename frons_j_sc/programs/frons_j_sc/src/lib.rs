use anchor_lang::prelude::*;

pub mod error;
pub mod state;
pub mod instructions;

use instructions::{
    create_journal::*,
    manage_editorial_board::*,
    submit_to_journal::*,
    review_journal_article::*,
    publish_article::*,
};

declare_id!("H8gA7JY5sDRQiKSV8XgzsypMQw4uzy38BaeCsLgDu6tb");

#[program]
pub mod frons_j_sc {
    use super::*;

    pub fn create_journal(
        ctx: Context<CreateJournal>,
        slug: String,
        name: String,
        description: String,
    ) -> Result<()> {
        instructions::create_journal::handler(ctx, slug, name, description)
    }

    pub fn manage_editorial_board(
        ctx: Context<ManageEditorialBoard>,
        member: Pubkey,
        is_adding: bool,
    ) -> Result<()> {
        instructions::manage_editorial_board::handler(ctx, member, is_adding)
    }

    pub fn submit_to_journal(
        ctx: Context<SubmitToJournal>,
        ipfs_hash: String,
    ) -> Result<()> {
        instructions::submit_to_journal::handler(ctx, ipfs_hash)
    }

    pub fn review_journal_article(
        ctx: Context<ReviewJournalArticle>,
        decision: String,
    ) -> Result<()> {
        instructions::review_journal_article::handler(ctx, decision)
    }

    pub fn publish_article(
        ctx: Context<PublishArticle>,
    ) -> Result<()> {
        instructions::publish_article::handler(ctx)
    }
}
