import { message } from 'antd';

// API響應接口（與後端保持一致）
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    requestId?: string;
    version?: string;
    timestamp: string;
  };
}

// API錯誤類
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;
  public timestamp: string;
  public path?: string;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: any,
    timestamp?: string,
    path?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = timestamp || new Date().toISOString();
    this.path = path;
  }
}

// 請求配置接口
export interface RequestConfig extends RequestInit {
  timeout?: number;
  showErrorMessage?: boolean;
  showSuccessMessage?: boolean;
  successMessage?: string;
}

// API客戶端類
class ApiClient {
  private baseURL: string;
  private defaultTimeout: number = 30000; // 30秒
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // 通用請求方法
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      showErrorMessage = true,
      showSuccessMessage = false,
      successMessage,
      ...fetchConfig
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const requestId = this.generateRequestId();

    // 添加請求ID到headers
    const headers = {
      ...this.defaultHeaders,
      ...fetchConfig.headers,
      'X-Request-ID': requestId,
    };

    // 創建AbortController用於超時控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`🚀 API Request: ${fetchConfig.method || 'GET'} ${url}`, {
        requestId,
        headers,
        body: fetchConfig.body,
      });

      const response = await fetch(url, {
        ...fetchConfig,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 解析響應
      const responseData: ApiResponse<T> = await response.json();

      console.log(`📥 API Response: ${response.status}`, {
        requestId,
        url,
        success: responseData.success,
        data: responseData.data,
      });

      // 處理成功響應
      if (response.ok && responseData.success) {
        if (showSuccessMessage && successMessage) {
          message.success(successMessage);
        }
        return responseData;
      }

      // 處理API錯誤響應
      if (responseData.error) {
        const apiError = new ApiError(
          responseData.error.message,
          response.status,
          responseData.error.code,
          responseData.error.details,
          responseData.error.timestamp,
          responseData.error.path
        );

        if (showErrorMessage) {
          this.showErrorMessage(apiError);
        }

        throw apiError;
      }

      // 處理HTTP錯誤但沒有錯誤詳情的情況
      const httpError = new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        'HTTP_ERROR'
      );

      if (showErrorMessage) {
        this.showErrorMessage(httpError);
      }

      throw httpError;
    } catch (error) {
      clearTimeout(timeoutId);

      // 處理網絡錯誤
      if (error instanceof ApiError) {
        throw error;
      }

      // 處理超時錯誤
      if (error instanceof DOMException && error.name === 'AbortError') {
        const timeoutError = new ApiError(
          '請求超時，請檢查網絡連接',
          408,
          'TIMEOUT_ERROR'
        );

        if (showErrorMessage) {
          this.showErrorMessage(timeoutError);
        }

        throw timeoutError;
      }

      // 處理其他錯誤
      const networkError = new ApiError(
        '網絡連接失敗，請檢查網絡設置',
        0,
        'NETWORK_ERROR',
        { originalError: error }
      );

      if (showErrorMessage) {
        this.showErrorMessage(networkError);
      }

      throw networkError;
    }
  }

  // GET請求
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  // POST請求
  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT請求
  async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE請求
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // PATCH請求
  async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // 文件上傳
  async upload<T>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const uploadConfig = {
      ...config,
      method: 'POST',
      body: formData,
      headers: {
        // 不設置Content-Type，讓瀏覽器自動設置multipart/form-data
        ...config?.headers,
      },
    };

    // 移除Content-Type以支持文件上傳
    delete (uploadConfig.headers as any)['Content-Type'];

    return this.request<T>(endpoint, uploadConfig);
  }

  // 生成請求ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 顯示錯誤消息
  private showErrorMessage(error: ApiError) {
    let errorMessage = error.message;

    // 根據錯誤代碼提供更友好的消息
    switch (error.code) {
      case 'VALIDATION_ERROR':
        errorMessage = '數據驗證失敗，請檢查輸入內容';
        break;
      case 'UNAUTHORIZED':
        errorMessage = '登錄已過期，請重新登錄';
        break;
      case 'FORBIDDEN':
        errorMessage = '您沒有權限執行此操作';
        break;
      case 'NOT_FOUND':
        errorMessage = '請求的資源不存在';
        break;
      case 'CONFLICT':
        errorMessage = '數據衝突，請刷新頁面後重試';
        break;
      case 'TIMEOUT_ERROR':
        errorMessage = '請求超時，請檢查網絡連接';
        break;
      case 'NETWORK_ERROR':
        errorMessage = '網絡連接失敗，請檢查網絡設置';
        break;
      case 'INTERNAL_SERVER_ERROR':
        errorMessage = '服務器內部錯誤，請稍後重試';
        break;
    }

    message.error(errorMessage);
  }

  // 設置認證token
  setAuthToken(token: string) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      Authorization: `Bearer ${token}`,
    };
  }

  // 移除認證token
  removeAuthToken() {
    const { Authorization, ...headers } = this.defaultHeaders as any;
    this.defaultHeaders = headers;
  }
}

// 創建默認API客戶端實例
export const apiClient = new ApiClient();

// 便捷函數
export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) => 
    apiClient.get<T>(endpoint, config),
  
  post: <T>(endpoint: string, data?: any, config?: RequestConfig) => 
    apiClient.post<T>(endpoint, data, config),
  
  put: <T>(endpoint: string, data?: any, config?: RequestConfig) => 
    apiClient.put<T>(endpoint, data, config),
  
  delete: <T>(endpoint: string, config?: RequestConfig) => 
    apiClient.delete<T>(endpoint, config),
  
  patch: <T>(endpoint: string, data?: any, config?: RequestConfig) => 
    apiClient.patch<T>(endpoint, data, config),
  
  upload: <T>(endpoint: string, formData: FormData, config?: RequestConfig) => 
    apiClient.upload<T>(endpoint, formData, config),
};

// React Hook for API calls
export function useApi() {
  return {
    api,
    apiClient,
    ApiError,
  };
}