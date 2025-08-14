import { NextRequest, NextResponse } from 'next/server';

// 統一錯誤響應格式
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
  };
}

// 統一成功響應格式
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 自定義錯誤類
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || this.getDefaultErrorCode(statusCode);
    this.details = details;
  }

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

// 錯誤日誌記錄
export function logError(error: Error, request: NextRequest, additionalInfo?: any) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof ApiError && {
        statusCode: error.statusCode,
        code: error.code,
        details: error.details,
      }),
    },
    additionalInfo,
  };

  // 在開發環境下輸出到控制台
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', JSON.stringify(errorLog, null, 2));
  }

  // 在生產環境下可以發送到日誌服務
  // TODO: 集成外部日誌服務 (如 Sentry, LogRocket 等)
}

// 全局錯誤處理中間件
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      // 記錄錯誤
      logError(error as Error, request);

      // 處理已知的API錯誤
      if (error instanceof ApiError) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            timestamp: new Date().toISOString(),
            path: new URL(request.url).pathname,
          },
        };

        return NextResponse.json(errorResponse, {
          status: error.statusCode,
        });
      }

      // 處理未知錯誤
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: process.env.NODE_ENV === 'development' 
            ? (error as Error).message 
            : '服務器內部錯誤',
          timestamp: new Date().toISOString(),
          path: new URL(request.url).pathname,
        },
      };

      return NextResponse.json(errorResponse, {
        status: 500,
      });
    }
  };
}

// 成功響應輔助函數
export function createSuccessResponse<T>(
  data: T,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  status: number = 200
): NextResponse {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(pagination && { pagination }),
  };
  
  return NextResponse.json(response, { status });
}

// 常用錯誤創建函數
export const createError = {
  badRequest: (message: string, details?: any) => 
    new ApiError(message, 400, 'BAD_REQUEST', details),
  
  unauthorized: (message: string = '未授權訪問') => 
    new ApiError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message: string = '禁止訪問') => 
    new ApiError(message, 403, 'FORBIDDEN'),
  
  notFound: (message: string = '資源不存在') => 
    new ApiError(message, 404, 'NOT_FOUND'),
  
  conflict: (message: string, details?: any) => 
    new ApiError(message, 409, 'CONFLICT', details),
  
  validation: (message: string, details?: any) => 
    new ApiError(message, 422, 'VALIDATION_ERROR', details),
  
  internal: (message: string = '服務器內部錯誤') => 
    new ApiError(message, 500, 'INTERNAL_SERVER_ERROR'),
};

// 便捷的錯誤創建函數（向後兼容）
export const createValidationError = (message: string, details?: any) => 
  new ApiError(message, 422, 'VALIDATION_ERROR', details);

export const createNotFoundError = (message: string = '資源不存在') => 
  new ApiError(message, 404, 'NOT_FOUND');

export const createBadRequestError = (message: string, details?: any) => 
  new ApiError(message, 400, 'BAD_REQUEST', details);