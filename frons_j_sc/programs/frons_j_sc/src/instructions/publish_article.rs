use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
pub struct PublishArticle<'info> {
    #[account(mut)]
    pub article: Account<'info, JournalArticle>,
    #[account(
        has_one = authority @ FronsJError::Unauthorized
    )]
    pub journal: Account<'info, Journal>,
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub fee_payer: Signer<'info>,
}

pub fn handler(ctx: Context<PublishArticle>) -> Result<()> {
    let article = &mut ctx.accounts.article;
    require!(article.journal_id == ctx.accounts.journal.key(), FronsJError::Unauthorized);
    require!(article.is_accepted(), FronsJError::InvalidArticleStatus);
    
    article.status = ArticleStatus::Published;
    article.publication_time = Some(Clock::get()?.unix_timestamp);
    
    Ok(())
}
