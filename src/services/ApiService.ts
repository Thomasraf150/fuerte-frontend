/**
 * Base API Service following CLAUDE.md Service Layer Pattern
 * Implements proper error handling, type safety, and abstraction
 */

export interface ApiResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

export interface BatchPaginationResponse<T> {
  data: T[];
  pagination: {
    currentBatch: number;
    totalBatches: number;
    batchStartPage: number;
    batchEndPage: number;
    totalRecords: number;
    hasNextBatch: boolean;
  };
}

export class ApiServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ApiServiceError';
  }
}

/**
 * Abstract base API service implementing common patterns
 */
export abstract class BaseApiService {
  protected readonly endpoint: string;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_API_GRAPHQL || '';
    if (!this.endpoint) {
      throw new Error('API endpoint not configured. Please set NEXT_PUBLIC_API_GRAPHQL environment variable.');
    }
  }

  /**
   * Execute GraphQL query with proper error handling
   */
  protected async executeQuery<T>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: variables || {},
        }),
      });

      if (!response.ok) {
        throw new ApiServiceError(
          `HTTP error! status: ${response.status}`,
          response.status
        );
      }

      const result: ApiResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new ApiServiceError(
          `GraphQL Error: ${result.errors[0].message}`
        );
      }

      if (!result.data) {
        throw new ApiServiceError('No data received from server');
      }

      return result.data;
    } catch (error) {
      if (error instanceof ApiServiceError) {
        throw error;
      }

      console.error('API Service Error:', error);
      throw new ApiServiceError(
        'Failed to execute API request',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Handle errors consistently across all services
   */
  protected handleError(error: Error, context: string): never {
    console.error(`${context}:`, error);
    
    if (error instanceof ApiServiceError) {
      throw error;
    }

    throw new ApiServiceError(
      `${context} failed`,
      undefined,
      error
    );
  }
}