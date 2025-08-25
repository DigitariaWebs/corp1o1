import { auth } from '@clerk/nextjs';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  user?: any;
}

// Request configuration
interface RequestConfig extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Enhanced fetch function with automatic token handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { requireAuth = true, headers = {}, ...restConfig } = config;
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Prepare headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authentication token if required (server-side)
  if (requireAuth && typeof window === 'undefined') {
    try {
      const { getToken } = auth();
      const token = await getToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting server-side token:', error);
    }
  }

  const requestConfig: RequestInit = {
    ...restConfig,
    headers: requestHeaders,
  };

  try {
    const response = await fetch(url, requestConfig);
    
    // Handle different response types
    let data: ApiResponse<T>;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = {
        success: response.ok,
        data: text as T,
        message: response.ok ? 'Success' : 'Request failed',
      };
    }

    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Return error response
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Request failed',
    };
  }
}

/**
 * Client-side API hook for React components
 */
export function useApiClient() {
  /**
   * Make authenticated API request from client-side
   */
  const request = async <T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> => {
    const { requireAuth = true, headers = {}, ...restConfig } = config;
    
    if (typeof window === 'undefined') {
      throw new Error('useApiClient can only be used on the client-side');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    // Prepare headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authentication token if required (client-side)
    if (requireAuth) {
      try {
        // Get token from Clerk
        const { getToken } = await import('@clerk/nextjs');
        const token = await getToken();
        if (token) {
          requestHeaders['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting client-side token:', error);
      }
    }

    const requestConfig: RequestInit = {
      ...restConfig,
      headers: requestHeaders,
    };

    try {
      const response = await fetch(url, requestConfig);
      
      // Handle different response types
      let data: ApiResponse<T>;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = {
          success: response.ok,
          data: text as T,
          message: response.ok ? 'Success' : 'Request failed',
        };
      }

      // Handle HTTP errors
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Return error response
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Request failed',
      };
    }
  };

  // Convenience methods
  const get = <T = any>(endpoint: string, config: RequestConfig = {}) => 
    request<T>(endpoint, { ...config, method: 'GET' });

  const post = <T = any>(endpoint: string, data?: any, config: RequestConfig = {}) =>
    request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });

  const put = <T = any>(endpoint: string, data?: any, config: RequestConfig = {}) =>
    request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });

  const del = <T = any>(endpoint: string, config: RequestConfig = {}) =>
    request<T>(endpoint, { ...config, method: 'DELETE' });

  return {
    request,
    get,
    post,
    put,
    delete: del,
  };
}

// Convenience functions for direct use
export const api = {
  get: <T = any>(endpoint: string, config: RequestConfig = {}) =>
    apiRequest<T>(endpoint, { ...config, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, config: RequestConfig = {}) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, config: RequestConfig = {}) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, config: RequestConfig = {}) =>
    apiRequest<T>(endpoint, { ...config, method: 'DELETE' }),
};

export default api;