export interface CVStatus {
  success: boolean;
  hasCV: boolean;
  canSubmitManuscripts: boolean;
  hasCompleteProfile?: boolean;
  userInfo?: {
    fullName: string;
    institution: string;
    profession: string;
    registeredAt: string;
  };
  walletAddress: string;
  message: string;
  requiresAction?: string;
}

export interface ManuscriptSubmissionRequest {
  manuscript: File;
  title: string;
  author: string;
  category: string;
  abstract: string;
  keywords: string;
  authorWallet: string;
}

export interface ManuscriptSubmissionResponse {
  success: boolean;
  manuscript: {
    id: number;
    cid: string;
    title: string;
    author: string;
    category: string;
    filename: string;
    size: number;
    type: string;
    submittedAt: string;
    status: "under_review" | "published" | "rejected";
  };
  metadata: {
    cid: string;
  };
  ipfsUrls: {
    manuscript: string;
    metadata: string;
  };
  review: {
    id: number;
    status: string;
  };
}

export interface ManuscriptMetadataRequest {
  title: string;
  author: string;
  category: string | string[];
  ipfs_hash: string;
  abstract: string;
  keywords: string[];
  author_wallet: string;
}

export interface PendingReviewManuscript {
  id: number;
  title: string;
  author: string;
  category: string[];
  abstract: string;
  status: string;
  submissionDate: string;
  cid: string;
  reviewInfo: {
    reviewsCompleted: number;
    reviewsRequired: number;
    canPublish: boolean;
  };
  ipfsUrls: {
    manuscript: string;
  };
}

export interface PublishedManuscript {
  id: number;
  title: string;
  author: string;
  category: string[];
  status: "published";
  submissionDate: string;
  publishedDate: string;
  cid: string;
  ipfsUrls: {
    manuscript: string;
  };
  nftMint?: string;
}

export interface PendingReviewResponse {
  success: boolean;
  status: string;
  count: number;
  manuscripts: PendingReviewManuscript[];
}

export interface PublishedManuscriptsResponse {
  success: boolean;
  category: string[];
  count: number;
  manuscripts: PublishedManuscript[];
}

export interface ReviewAssignmentRequest {
  reviewers: string[];
  assignedBy: string;
}

export interface ReviewAssignmentResponse {
  success: boolean;
  manuscriptId: number;
  reviewersAssigned: number;
  reviewRecords: Array<{
    id: number;
    reviewer: string;
    deadline: string;
  }>;
  message: string;
}

export interface ReviewSubmissionRequest {
  decision: "accept" | "reject" | "minor_revision" | "major_revision";
  comments: string;
  confidentialComments?: string;
  reviewerWallet: string;
}

export interface ReviewSubmissionResponse {
  success: boolean;
  review: {
    id: number;
    status: string;
    decision: string;
    completedAt: string;
  };
  manuscriptId: number;
  reviewProgress: {
    completed: number;
    required: number;
    canPublish: boolean;
    publishRecommendation: string | null;
  };
  message: string;
}

export interface ReviewStatusResponse {
  success: boolean;
  manuscriptId: number;
  manuscriptTitle: string;
  currentStatus: string;
  totalReviewers: number;
  reviewsCompleted: number;
  reviewsInProgress: number;
  reviewsPending: number;
  requiredReviews: number;
  canPublish: boolean;
  nextAction: string;
  reviews: Array<{
    id: number;
    reviewer: string;
    status: string;
    deadline: string;
    completed?: string;
    overdue: boolean;
  }>;
}

export interface PublicationRequest {
  publishedBy: string;
}

export interface PublicationResponse {
  success: boolean;
  manuscript: {
    id: number;
    title: string;
    author: string;
    status: string;
    publishedDate: string;
    publishedBy: string;
  };
  message: string;
}

// CV Registration Types
export interface CVUploadRequest {
  cv: File;
  walletAddress: string;
}

export interface CVParseResponse {
  success: boolean;
  data: {
    selfIdentity: {
      fullName: string;
      title: string;
      profession: string;
      institution: string;
      location: string;
      field: string;
      specialization: string;
    };
    contact: {
      email: string;
      phone?: string;
      linkedIn?: string;
      github?: string;
      website?: string;
      orcid?: string;
      googleScholar?: string;
    };
    overview: string;
    education: Array<{
      institution?: string;
      degree?: string;
      field?: string;
      startDate?: string;
      endDate?: string;
      gpa?: string;
      location?: string;
    }>;
    experience: Array<{
      company?: string;
      position?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
      location?: string;
      type?: string;
    }>;
    publications: Array<{
      title?: string;
      authors?: string[];
      venue?: string;
      date?: string;
      doi?: string;
      url?: string;
    }>;
    awards: Array<{
      name?: string;
      issuer?: string;
      date?: string;
      description?: string;
    }>;
  };
  extractedText: string;
  message: string;
}

export interface UserProfileResponse {
  success: boolean;
  profile: {
    id: number;
    filename: string;
    createdAt: string;
    walletAddress: string;
    personalInfo: {
      fullName: string;
      title: string;
      profession: string;
      institution: string;
      location: string;
      field: string;
      specialization: string;
      photoUrl?: string;
    };
    contact: {
      email: string;
      phone?: string;
      linkedIn?: string;
      github?: string;
      website?: string;
      orcid?: string;
      googleScholar?: string;
    };
    summary: {
      education: number;
      experience: number;
      publications: number;
      awards: number;
    };
    overview?: string;
    profilePhoto?: string;
  };
  message: string;
}

export interface ProfileUpdateRequest {
  personalInfo?: {
    fullName?: string;
    title?: string;
    profession?: string;
    institution?: string;
    location?: string;
    field?: string;
    specialization?: string;
    photoUrl?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    linkedIn?: string;
    github?: string;
    website?: string;
    orcid?: string;
    googleScholar?: string;
  };
  overview?: string;
}

export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  profile: UserProfileResponse["profile"];
  updatedFields: string[];
}

// NFT Integration Types
export interface NFTHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  service: string;
  timestamp: string;
  services: {
    ipfs: boolean;
    metaboss: boolean;
    imageGenerator: boolean;
  };
  dependencies: {
    pinata: boolean;
    metaboss: boolean;
    imageGeneration: boolean;
  };
}

export interface NFTMetadataRequest {
  mint: string;
  doci: string;
  title: string;
  description: string;
  ipfs_hash: string;
  author: string;
  reviewers?: string[];
  publication_date?: number;
  authors_share?: number;
  platform_share?: number;
  reviewers_share?: number;
}

export interface NFTMetadataResponse {
  success: boolean;
  mint: string;
  doci: string;
  imageIpfsHash: string;
  metadataIpfsHash: string;
  explorerUrl: string;
}

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url: string;
  properties: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
  };
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  collection: {
    name: string;
    family: string;
  };
}

export interface NFTMetadataGetResponse {
  success: boolean;
  mint: string;
  metadata: NFTMetadata;
  explorerUrl: string;
}

export interface NFTVerificationResponse {
  mint: string;
  exists: boolean;
  explorerUrl: string;
}

// Error Types
export interface BackendError {
  error: string;
  code?: string;
  message: string;
  requiresCV?: boolean;
  walletAddress?: string;
  required?: string[];
  details?: any;
}

export interface CVRequiredError extends BackendError {
  code: "CV_REQUIRED";
  requiresCV: true;
  walletAddress: string;
}

export interface MissingWalletError extends BackendError {
  code: "MISSING_WALLET";
}

export interface InsufficientReviewersError extends BackendError {
  code: "INSUFFICIENT_REVIEWERS";
}

export interface InvalidDecisionError extends BackendError {
  code: "INVALID_DECISION";
}

export interface PublicationNotReadyError extends BackendError {
  code: "PUBLICATION_NOT_READY";
  details: {
    reviewsCompleted: number;
    reviewsRequired: number;
    approvedReviews: number;
    requiredApprovals: number;
  };
}
