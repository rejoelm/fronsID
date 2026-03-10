/**
 * Performance Optimization Cache Layer
 * Provides token caching, API response caching, and smart contract data caching
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface TokenCacheItem {
  accessToken: string;
  expiresAt: number;
  privyUserId: string;
}

class PerformanceCache {
  private cache = new Map<string, CacheItem<any>>();
  private tokenCache = new Map<string, TokenCacheItem>();

  // Cache TTL in milliseconds
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly TOKEN_TTL = 45 * 60 * 1000; // 45 minutes (tokens expire at 60min)
  private readonly API_RESPONSE_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly USER_DATA_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly SMART_CONTRACT_TTL = 1 * 60 * 1000; // 1 minute

  /**
   * Generic cache methods
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.tokenCache.clear();
  }

  /**
   * Token caching methods
   */
  setToken(privyUserId: string, accessToken: string, expiresIn: number = this.TOKEN_TTL): void {
    const expiresAt = Date.now() + expiresIn;
    this.tokenCache.set(privyUserId, {
      accessToken,
      expiresAt,
      privyUserId,
    });
  }

  getToken(privyUserId: string): string | null {
    const tokenItem = this.tokenCache.get(privyUserId);
    if (!tokenItem) return null;

    const now = Date.now();
    if (now > tokenItem.expiresAt) {
      this.tokenCache.delete(privyUserId);
      return null;
    }

    return tokenItem.accessToken;
  }

  invalidateToken(privyUserId: string): void {
    this.tokenCache.delete(privyUserId);
  }

  /**
   * API response caching
   */
  setApiResponse<T>(endpoint: string, params: Record<string, any>, data: T): void {
    const cacheKey = this.createApiCacheKey(endpoint, params);
    this.set(cacheKey, data, this.API_RESPONSE_TTL);
  }

  getApiResponse<T>(endpoint: string, params: Record<string, any>): T | null {
    const cacheKey = this.createApiCacheKey(endpoint, params);
    return this.get<T>(cacheKey);
  }

  invalidateApiCache(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * User data caching
   */
  setUserData(userId: string, data: any): void {
    this.set(`user:${userId}`, data, this.USER_DATA_TTL);
  }

  getUserData(userId: string): any | null {
    return this.get(`user:${userId}`);
  }

  invalidateUserData(userId: string): void {
    this.delete(`user:${userId}`);
    // Also invalidate related data
    this.invalidateApiCache(`user:${userId}`);
  }

  /**
   * Smart contract data caching
   */
  setSmartContractData(address: string, method: string, data: any): void {
    const key = `contract:${address}:${method}`;
    this.set(key, data, this.SMART_CONTRACT_TTL);
  }

  getSmartContractData(address: string, method: string): any | null {
    const key = `contract:${address}:${method}`;
    return this.get(key);
  }

  invalidateSmartContractData(address: string, method?: string): void {
    if (method) {
      this.delete(`contract:${address}:${method}`);
    } else {
      this.invalidateApiCache(`contract:${address}`);
    }
  }

  /**
   * Manuscript data caching
   */
  setManuscriptData(manuscriptId: string, data: any): void {
    this.set(`manuscript:${manuscriptId}`, data, this.USER_DATA_TTL);
  }

  getManuscriptData(manuscriptId: string): any | null {
    return this.get(`manuscript:${manuscriptId}`);
  }

  invalidateManuscriptData(manuscriptId: string): void {
    this.delete(`manuscript:${manuscriptId}`);
    this.invalidateApiCache('manuscripts');
  }

  /**
   * Performance monitoring
   */
  getCacheStats(): {
    totalItems: number;
    tokenCacheSize: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const totalItems = this.cache.size;
    const tokenCacheSize = this.tokenCache.size;
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0;
    this.cache.forEach((item) => {
      memoryUsage += JSON.stringify(item).length * 2; // UTF-16 characters
    });
    this.tokenCache.forEach((item) => {
      memoryUsage += JSON.stringify(item).length * 2;
    });

    return {
      totalItems,
      tokenCacheSize,
      hitRate: 0, // Would need hit/miss tracking for accurate calculation
      memoryUsage: Math.round(memoryUsage / 1024), // KB
    };
  }

  /**
   * Cache cleanup - remove expired items
   */
  cleanup(): void {
    const now = Date.now();
    
    // Clean general cache
    const expiredKeys: string[] = [];
    this.cache.forEach((item, key) => {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    });
    expiredKeys.forEach(key => this.cache.delete(key));

    // Clean token cache
    const expiredTokenKeys: string[] = [];
    this.tokenCache.forEach((item, key) => {
      if (now > item.expiresAt) {
        expiredTokenKeys.push(key);
      }
    });
    expiredTokenKeys.forEach(key => this.tokenCache.delete(key));
  }

  /**
   * Private helper methods
   */
  private createApiCacheKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `api:${endpoint}:${JSON.stringify(sortedParams)}`;
  }
}

// Create singleton instance
export const performanceCache = new PerformanceCache();

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceCache.cleanup();
  }, 5 * 60 * 1000);
}

// Cache-aware fetch wrapper
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  ttl?: number
): Promise<T> {
  const key = cacheKey || `fetch:${url}:${JSON.stringify(options)}`;
  
  // Try to get from cache first
  const cached = performanceCache.get<T>(key);
  if (cached) {
    return cached;
  }

  // Fetch from network
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json() as T;
  
  // Cache the response
  performanceCache.set(key, data, ttl);
  
  return data;
}

// Enhanced API client with caching
export class CachedApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  async get<T>(
    endpoint: string,
    params: Record<string, any> = {},
    options: {
      cache?: boolean;
      cacheTtl?: number;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { cache = true, cacheTtl, headers = {} } = options;
    
    // Check cache first if enabled
    if (cache) {
      const cached = performanceCache.getApiResponse<T>(endpoint, params);
      if (cached) {
        return cached;
      }
    }

    // Build URL with query parameters
    const url = new URL(endpoint, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    // Make request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as T;

    // Cache the response if enabled
    if (cache) {
      performanceCache.setApiResponse(endpoint, params, data);
    }

    return data;
  }

  async post<T>(
    endpoint: string,
    body: any,
    options: {
      headers?: Record<string, string>;
      invalidateCache?: string[];
    } = {}
  ): Promise<T> {
    const { headers = {}, invalidateCache = [] } = options;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as T;

    // Invalidate related cache entries
    invalidateCache.forEach(pattern => {
      performanceCache.invalidateApiCache(pattern);
    });

    return data;
  }
}

export default performanceCache;