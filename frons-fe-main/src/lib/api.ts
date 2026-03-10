/**
 * API Integration Layer for Fronsciers Platform
 * Handles communication between frontend, backend, and smart contracts
 */

import axios from "axios";
import { usePrivy } from "@privy-io/react-auth";
import { performanceCache, CachedApiClient } from "./cache";

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're running in production (deployed)
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.VERCEL_ENV === 'production' ||
                      typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  
  // Use environment variable if set, otherwise fallback based on environment
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback URLs
  const productionUrl = 'https://frons-be-production.up.railway.app/api';
  const developmentUrl = 'http://localhost:5001/api';
  
  const apiUrl = isProduction ? productionUrl : developmentUrl;
  
  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Manuscript {
  id: string;
  title: string;
  author: string;
  category: string;
  abstract: string;
  keywords: string[];
  status: "pending" | "under_review" | "accepted" | "rejected" | "published";
  cid: string;
  ipfsUrl: string;
  authorWallet: string;
  privyUserId?: string;
  submittedAt: string;
  reviewers?: string[];
  decisions?: string[];
}

export interface ReviewAssignment {
  id: string;
  manuscriptId: string;
  reviewerId: string;
  status: "pending" | "completed" | "declined";
  deadline: string;
}

// API Client with Privy Authentication and Performance Optimization
export class ApiClient {
  private cachedClient: CachedApiClient;

  constructor() {
    this.cachedClient = new CachedApiClient(API_BASE_URL, {
      "Content-Type": "application/json",
    });
  }

  private getAuthHeaders = async () => {
    // This will be used in components that have access to Privy context
    return {};
  };

  private async getCachedToken(privyUserId?: string): Promise<string | null> {
    if (!privyUserId) return null;
    return performanceCache.getToken(privyUserId);
  }

  private cacheToken(privyUserId: string, token: string): void {
    // Cache token for 45 minutes (tokens expire at 60 minutes)
    performanceCache.setToken(privyUserId, token, 45 * 60 * 1000);
  }

  // Manuscript endpoints with caching
  async getManuscriptsByStatus(
    status: "under_review" | "published" | "rejected",
    limit = 10,
    category?: string,
    accessToken?: string
  ): Promise<Manuscript[]> {
    const params = {
      status,
      limit: limit.toString(),
      ...(category && { category }),
    };
    const cacheKey = `manuscripts:status:${status}:${limit}:${
      category || "all"
    }`;

    // Check cache first for non-authenticated requests
    if (!accessToken) {
      const cached = performanceCache.getApiResponse<{
        manuscripts: Manuscript[];
      }>("/manuscripts", params);
      if (cached) {
        return cached.manuscripts || [];
      }
    }

    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined;
    const response = await this.cachedClient.get<{ manuscripts: Manuscript[] }>(
      "/manuscripts",
      params,
      { headers, cache: !accessToken } // Only cache public data
    );

    return response.manuscripts || [];
  }

  async getAuthorManuscripts(
    walletAddress: string,
    accessToken?: string
  ): Promise<Manuscript[]> {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    try {
      // Try Privy endpoint first if token available
      if (accessToken) {
        const response = await axios.get(`${API_BASE_URL}/manuscripts/author`, {
          headers,
        });
        return response.data.manuscripts || [];
      } else {
        // Fall back to legacy endpoint
        const response = await axios.get(
          `${API_BASE_URL}/manuscripts/author/${walletAddress}`
        );
        return response.data.manuscripts || [];
      }
    } catch (error) {
      console.error("Failed to fetch author manuscripts:", error);
      return [];
    }
  }

  async getPendingReviewManuscripts(
    limit = 10,
    category?: string,
    accessToken?: string
  ): Promise<Manuscript[]> {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};
    const params = new URLSearchParams({ limit: limit.toString() });
    if (category) params.append("category", category);

    const response = await axios.get(
      `${API_BASE_URL}/manuscripts/pending-review?${params}`,
      { headers }
    );
    return response.data.manuscripts || [];
  }

  async getPublishedManuscripts(
    category?: string,
    limit = 10,
    accessToken?: string
  ): Promise<Manuscript[]> {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    if (category) params.append("category", category);

    const response = await axios.get(`${API_BASE_URL}/manuscripts/published?${params}`, {
      headers,
    });
    return response.data.manuscripts || [];
  }

  // Review endpoints
  async assignReviewers(
    manuscriptId: string,
    reviewerCount = 3,
    accessToken?: string
  ): Promise<ApiResponse> {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const response = await axios.post(
      `${API_BASE_URL}/reviews/manuscript/${manuscriptId}/assign-reviewers`,
      { reviewerCount },
      { headers }
    );
    return response.data;
  }

  async getReviewStatus(
    manuscriptId: string,
    accessToken?: string
  ): Promise<ApiResponse> {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const response = await axios.get(
      `${API_BASE_URL}/reviews/manuscript/${manuscriptId}/status`,
      { headers }
    );
    return response.data;
  }

  async publishManuscript(
    manuscriptId: string,
    accessToken?: string
  ): Promise<ApiResponse> {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const response = await axios.post(
      `${API_BASE_URL}/manuscripts/${manuscriptId}/publish`,
      {},
      { headers }
    );
    return response.data;
  }

  async checkCVStatus(
    walletAddress?: string,
    accessToken?: string
  ): Promise<ApiResponse> {
    if (accessToken) {
      // Use Privy-authenticated endpoint
      const response = await axios.get(
        `${API_BASE_URL}/manuscripts/cv-status`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } else if (walletAddress) {
      // Use legacy endpoint
      const response = await axios.get(
        `${API_BASE_URL}/manuscripts/check-cv-status/${walletAddress}`
      );
      return response.data;
    } else {
      throw new Error("Either access token or wallet address required");
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data.success === true;
    } catch {
      return false;
    }
  }

  // NFT Health check
  async checkNFTHealth(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/nft-metadata/health`);
      return response.data;
    } catch (error) {
      console.error("Failed to check NFT health:", error);
      throw error;
    }
  }

  // Create NFT metadata
  async createNFTMetadata(data: any): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/nft-metadata/create`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create NFT metadata:", error);
      throw error;
    }
  }

  // Get NFT metadata
  async getNFTMetadata(mint: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/nft-metadata/${mint}`);
      return response.data;
    } catch (error) {
      console.error("Failed to get NFT metadata:", error);
      throw error;
    }
  }

  // Update NFT metadata
  async updateNFTMetadata(mint: string, data: any): Promise<any> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/nft-metadata/${mint}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Failed to update NFT metadata:", error);
      throw error;
    }
  }

  // Verify NFT metadata
  async verifyNFTMetadata(mint: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/nft-metadata/${mint}/verify`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to verify NFT metadata:", error);
      throw error;
    }
  }

  // Generate NFT preview image
  async generateNFTPreviewImage(data: any): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/nft-metadata/preview`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Failed to generate NFT preview image:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Backward compatibility export
export const backendAPI = apiClient;

// Utility functions for components
export const getApiClient = () => apiClient;
