use anchor_lang::prelude::*;

#[error_code]
pub enum FronsJError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid article status for this operation")]
    InvalidArticleStatus,
    #[msg("User is already a reviewer for this article")]
    AlreadyReviewer,
    #[msg("User is not a reviewer for this article")]
    NotAReviewer,
    #[msg("Name too long")]
    NameTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
}
