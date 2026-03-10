use anchor_lang::prelude::*;

#[error_code]
pub enum FronsciersError {
  #[msg("User does not meet submission requirements")]
  SubmissionRequirementsNotMet,
  #[msg("Invalid education level")]
  InvalidEducationLevel,
  #[msg("Insufficient published papers")]
  InsufficientPublishedPapers,
  #[msg("Invalid decision. Must be 'Accepted' or 'Rejected'")]
  InvalidDecision,
  #[msg("CV hash is required")]
  MissingCvHash,
  #[msg("IPFS hash is required")]
  MissingIpfsHash,
  #[msg("Manuscript already reviewed by this reviewer")]
  ReviewerAlreadyAdded,
  #[msg("Manuscript already has this decision")]
  DecisionAlreadyAdded,
  #[msg("Not enough reviews to make a decision")]
  NotEnoughReviews,
  #[msg("Manuscript is not pending")]
  ManuscriptNotPending,
  #[msg("Manuscript is not accepted")]
  ManuscriptNotAccepted,
  
  // Privy-related errors
  #[msg("Invalid Privy validation data")]
  InvalidPrivyValidation,
  #[msg("Academic email validation failed")]
  InvalidAcademicEmail,
  #[msg("Validation timestamp expired")]
  ValidationExpired,
  #[msg("User has already migrated to Privy")]
  UserAlreadyMigrated,
  #[msg("Backend signature is required")]
  MissingBackendSignature,
  #[msg("Invalid CV hash format")]
  InvalidCvHash,
  #[msg("Privy user ID is required")]
  MissingPrivyUserId,
  #[msg("Embedded wallet address is required")]
  MissingEmbeddedWallet,
  #[msg("CV verification required")]
  CVVerificationRequired,
  #[msg("Academic email verification required")]
  AcademicEmailRequired,
}