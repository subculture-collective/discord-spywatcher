import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  SpywatcherConfig,
  SpywatcherError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from './types';

/**
 * Base HTTP client for the Spywatcher API
 * Handles authentication, error handling, and request/response processing
 */
export class SpywatcherClient {
  private axiosInstance: AxiosInstance;
  private config: SpywatcherConfig;

  constructor(config: SpywatcherConfig) {
    this.config = {
      timeout: 30000,
      debug: false,
      ...config,
    };

    // Validate API key format
    if (!this.config.apiKey.startsWith('spy_live_')) {
      throw new ValidationError('API key must start with "spy_live_"');
    }

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        ...this.config.headers,
      },
    });

    // Request interceptor for debugging
    if (this.config.debug) {
      this.axiosInstance.interceptors.request.use((config) => {
        console.log('[Spywatcher SDK] Request:', {
          method: config.method,
          url: config.url,
          params: config.params,
        });
        return config;
      });
    }

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (this.config.debug) {
          console.log('[Spywatcher SDK] Response:', {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle and transform axios errors into Spywatcher errors
   */
  private handleError(error: AxiosError): SpywatcherError {
    if (error.response) {
      const { status, data } = error.response;

      // Extract error message from response
      const message =
        (data as { error?: string })?.error ||
        (data as { message?: string })?.message ||
        error.message;

      switch (status) {
        case 401:
        case 403:
          return new AuthenticationError(message);
        case 429:
          return new RateLimitError(message);
        case 400:
          return new ValidationError(message);
        default:
          return new SpywatcherError(message, status, data);
      }
    } else if (error.request) {
      return new SpywatcherError('No response received from server');
    } else {
      return new SpywatcherError(error.message);
    }
  }

  /**
   * Make a GET request
   */
  protected async get<T>(url: string, params?: unknown): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, { params });
    return response.data;
  }

  /**
   * Make a POST request
   */
  protected async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  protected async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  protected async delete<T>(url: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url);
    return response.data;
  }

  /**
   * Make a PATCH request
   */
  protected async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data);
    return response.data;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }
}
