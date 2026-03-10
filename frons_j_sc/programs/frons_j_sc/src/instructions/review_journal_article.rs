use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
pub struct ReviewJournalArticle<'info> {
    #[account(mut)]
    pub article: Account<'info, JournalArticle>,
    pub journal: Account<'info, Journal>,
    pub reviewer: Signer<'info>,

    #[account(mut)]
    pub fee_payer: Signer<'info>,
}

pub fn handler(ctx: Context<ReviewJournalArticle>, decision: String) -> Result<()> {
    let article = &mut ctx.accounts.article;
    let journal = &ctx.accounts.journal;

    require!(article.journal_id == journal.key(), FronsJError::Unauthorized);
    require!(journal.editorial_board.contains(&ctx.accounts.reviewer.key()), FronsJError::Unauthorized);
    require!(article.is_pending() || article.status == ArticleStatus::InReview, FronsJError::InvalidArticleStatus);
    require!(!article.reviewers.contains(&ctx.accounts.reviewer.key()), FronsJError::AlreadyReviewer);
    
    article.status = ArticleStatus::InReview;
    article.reviewers.push(ctx.accounts.reviewer.key());
    article.decisions.push(decision.clone());
    
    // Check if 2 reviewers reached
    if article.reviewers.len() >= 2 {
        if article.get_acceptance_count() >= 2 {
            article.status = ArticleStatus::Accepted;
        } else if article.get_rejection_count() >= 2 {
            article.status = ArticleStatus::Rejected;
        } else if article.reviewers.len() >= 3 {
             // Tie-breaker applied
             if article.get_acceptance_count() >= 2 {
                 article.status = ArticleStatus::Accepted;
             } else {
                 article.status = ArticleStatus::Rejected;
             }
        }
    }
    
    Ok(())
}
