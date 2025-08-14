import { NextResponse } from 'next/server';
import { logger } from './logger';

// 統一的API響應格式
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

// 分頁參數接口
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// 分頁結果接口
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API響應構建器類
class ApiResponseBuilder {
  private requestId?: string;
  private path?: string;

  constructor(requestId?: string, path?: string) {
    this.requestId = requestId;
    this.path = path;
  }

  // 成功響應
  success<T>(data: T, pagination?: ApiResponse<T>['pagination']): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(pagination && { pagination }),
      meta: {
        requestId: this.requestId,
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
    };

    logger.info('API Success Response', {
      path: this.path,
      requestId: this.requestId,
      dataType: typeof data,
      hasPagination: !!pagination,
    });

    return NextResponse.json(response);
  }

  // 錯誤響應
  error(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ): NextResponse<ApiResponse> {
    const errorCode = code || this.getDefaultErrorCode(statusCode);
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
        timestamp: new Date().toISOString(),
        path: this.path,
      },
      meta: {
        requestId: this.requestId,
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
    };

    logger.error('API Error Response', undefined, {
      path: this.path,
      requestId: this.requestId,
      statusCode,
      errorCode,
      message,
    });

    return NextResponse.json(response, { status: statusCode });
  }

  // 驗證錯誤響應
  validationError(message: string, details?: any): NextResponse<ApiResponse> {
    return this.error(message, 422, 'VALIDATION_ERROR', details);
  }

  // 未找到錯誤響應
  notFound(message: string = '資源不存在'): NextResponse<ApiResponse> {
    return this.error(message, 404, 'NOT_FOUND');
  }

  // 未授權錯誤響應
  unauthorized(message: string = '未授權訪問'): NextResponse<ApiResponse> {
    return this.error(message, 401, 'UNAUTHORIZED');
  }

  // 禁止訪問錯誤響應
  forbidden(message: string = '禁止訪問'): NextResponse<ApiResponse> {
    return this.error(message, 403, 'FORBIDDEN');
  }

  // 衝突錯誤響應
  conflict(message: string, details?: any): NextResponse<ApiResponse> {
    return this.error(message, 409, 'CONFLICT', details);
  }

  // 內部服務器錯誤響應
  internalError(message: string = '服務器內部錯誤'): NextResponse<ApiResponse> {
    return this.error(message, 500, 'INTERNAL_SERVER_ERROR');
  }

  // 獲取默認錯誤代碼
  private getDefaultErrorCode(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }
}

// 便捷函數：創建響應構建器
export function createApiResponse(requestId?: string, path?: string): ApiResponseBuilder {
  return new ApiResponseBuilder(requestId, path);
}

// 便捷函數：成功響應
export function successResponse<T>(
  data: T,
  pagination?: ApiResponse<T>['pagination']
): NextResponse<ApiResponse<T>> {
  return new ApiResponseBuilder().success(data, pagination);
}

// 便捷函數：錯誤響應
export function errorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): NextResponse<ApiResponse> {
  return new ApiResponseBuilder().error(message, statusCode, code, details);
}

// 分頁輔助函數
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): ApiResponse['pagination'] {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
    total: Math.max(0, total),
    totalPages: Math.max(0, totalPages),
  };
}

// 解析分頁參數
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const search = searchParams.get('search') || undefined;

  return {
    page: Math.max(1, page),
    limit: Math.min(Math.max(1, limit), 100), // 限制最大每頁數量
    sortBy,
    sortOrder,
    search,
  };
}

// 驗證必需參數
export function validateRequiredParams(params: Record<string, any>, required: string[]): string[] {
  const missing: string[] = [];
  
  for (const field of required) {
    if (params[field] === undefined || params[field] === null || params[field] === '') {
      missing.push(field);
    }
  }
  
  return missing;
}

// 數據轉換輔助函數
export function transformDatabaseResult<T>(result: any): T {
  // 處理 BigInt 類型轉換
  return JSON.parse(JSON.stringify(result, (key, value) => {
    if (typeof value === 'bigint') {
      return Number(value);
    }
    return value;
  }));
}

// 錯誤消息本地化
export const ERROR_MESSAGES = {
  VALIDATION_ERROR: '數據驗證失敗',
  NOT_FOUND: '資源不存在',
  UNAUTHORIZED: '未授權訪問',
  FORBIDDEN: '禁止訪問',
  CONFLICT: '數據衝突',
  INTERNAL_SERVER_ERROR: '服務器內部錯誤',
  BAD_REQUEST: '請求參數錯誤',
  DATABASE_ERROR: '數據庫操作失敗',
  NETWORK_ERROR: '網絡連接錯誤',
  TIMEOUT_ERROR: '請求超時',
} as const;

// 獲取本地化錯誤消息
export function getErrorMessage(code: string, defaultMessage?: string): string {
  return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || defaultMessage || '未知錯誤';
}