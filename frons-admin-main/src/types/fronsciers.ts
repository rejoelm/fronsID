import { PublicKey } from "@solana/web3.js";

export interface User {
  wallet: PublicKey;
  education: string;
  publishedPapers: number;
  bump: number;
}

export interface Manuscript {
  author: PublicKey;
  ipfsHash: string;
  status: string;
  reviewers: PublicKey[];
  decisions: string[];
  submissionTime: number;
  doci?: string;
  dociMint?: PublicKey;
  publicationDate?: number;
  bump: number;
}

export interface DOCIManuscript {
  doci: string;
  manuscriptAccount: PublicKey;
  mintAddress: PublicKey;
  manuscriptHash: number[];
  authors: PublicKey[];
  peerReviewers: PublicKey[];
  publicationDate: number;
  version: number;
  citationCount: number;
  accessCount: number;
  metadataUri: string;
  royaltyConfig: RoyaltyConfig;
  bump: number;
}

export interface RoyaltyConfig {
  authorsShare: number;
  platformShare: number;
  reviewersShare: number;
}

export interface DOCIRegistry {
  totalPublished: number;
  currentYear: number;
  nextSequence: number;
  authority: PublicKey;
  bump: number;
}

export interface EscrowAccount {
  authority: PublicKey;
  bump: number;
}

export interface ManuscriptSubmission {
  ipfsHash: string;
  title: string;
  description: string;
  authors: string[];
  keywords: string[];
}

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  properties: {
    files: Array<{
      type: string;
      uri: string;
    }>;
    category: string;
    creators: Array<{
      address: string;
      share: number;
    }>;
  };
}
