'use client';

import React, { Component, ReactNode } from 'react';
import { Button, Result, Typography, Card, Space, Collapse } from 'antd';
import { ReloadOutlined, BugOutlined, HomeOutlined } from '@ant-design/icons';
import { ApiError } from '@/lib/api-client';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
}

// 全局錯誤邊界組件
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // 記錄錯誤
    console.error('🚨 Error Boundary caught an error:', {
      error,
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // 調用外部錯誤處理函數
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: 發送錯誤到監控服務（如Sentry）
    // this.sendErrorToMonitoring(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定義fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;
      const isApiError = error instanceof ApiError;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <Result
              status="error"
              title="頁面出現錯誤"
              subTitle={isApiError ? error.message : "抱歉，頁面遇到了一些問題。我們已經記錄了這個錯誤，請稍後重試。"}
              extra={
                <Space direction="vertical" size="middle" className="w-full">
                  <Space wrap>
                    <Button type="primary" icon={<ReloadOutlined />} onClick={this.handleRetry}>
                      重試
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={this.handleReload}>
                      刷新頁面
                    </Button>
                    <Button icon={<HomeOutlined />} onClick={this.handleGoHome}>
                      返回首頁
                    </Button>
                  </Space>

                  {/* 錯誤詳情（開發環境或顯式啟用時顯示） */}
                  {(process.env.NODE_ENV === 'development' || this.props.showErrorDetails) && (
                    <Card size="small" className="text-left">
                      <Space direction="vertical" size="small" className="w-full">
                        <div>
                          <Text strong>錯誤ID：</Text>
                          <Text code>{errorId}</Text>
                        </div>
                        
                        {isApiError && (
                          <>
                            <div>
                              <Text strong>錯誤代碼：</Text>
                              <Text code>{error.code}</Text>
                            </div>
                            <div>
                              <Text strong>狀態碼：</Text>
                              <Text code>{error.statusCode}</Text>
                            </div>
                            {error.path && (
                              <div>
                                <Text strong>請求路徑：</Text>
                                <Text code>{error.path}</Text>
                              </div>
                            )}
                          </>
                        )}

                        <Collapse ghost>
                          <Panel 
                            header={<Text type="secondary"><BugOutlined /> 技術詳情</Text>} 
                            key="details"
                          >
                            <Space direction="vertical" size="small" className="w-full">
                              <div>
                                <Text strong>錯誤消息：</Text>
                                <Paragraph code copyable className="mb-2">
                                  {error?.message}
                                </Paragraph>
                              </div>
                              
                              {error?.stack && (
                                <div>
                                  <Text strong>錯誤堆棧：</Text>
                                  <Paragraph code copyable className="mb-2 max-h-40 overflow-auto">
                                    {error.stack}
                                  </Paragraph>
                                </div>
                              )}
                              
                              {errorInfo?.componentStack && (
                                <div>
                                  <Text strong>組件堆棧：</Text>
                                  <Paragraph code copyable className="mb-2 max-h-40 overflow-auto">
                                    {errorInfo.componentStack}
                                  </Paragraph>
                                </div>
                              )}
                              
                              {isApiError && error.details && (
                                <div>
                                  <Text strong>錯誤詳情：</Text>
                                  <Paragraph code copyable className="mb-2">
                                    {JSON.stringify(error.details, null, 2)}
                                  </Paragraph>
                                </div>
                              )}
                            </Space>
                          </Panel>
                        </Collapse>
                      </Space>
                    </Card>
                  )}
                </Space>
              }
            />
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// API錯誤顯示組件
interface ApiErrorDisplayProps {
  error: ApiError;
  onRetry?: () => void;
  showDetails?: boolean;
}

export const ApiErrorDisplay: React.FC<ApiErrorDisplayProps> = ({
  error,
  onRetry,
  showDetails = false,
}) => {
  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'UNAUTHORIZED':
        return '🔒';
      case 'FORBIDDEN':
        return '🚫';
      case 'NOT_FOUND':
        return '🔍';
      case 'VALIDATION_ERROR':
        return '⚠️';
      case 'TIMEOUT_ERROR':
        return '⏰';
      case 'NETWORK_ERROR':
        return '🌐';
      default:
        return '❌';
    }
  };

  const getErrorTitle = (code: string) => {
    switch (code) {
      case 'UNAUTHORIZED':
        return '登錄已過期';
      case 'FORBIDDEN':
        return '權限不足';
      case 'NOT_FOUND':
        return '資源不存在';
      case 'VALIDATION_ERROR':
        return '數據驗證失敗';
      case 'TIMEOUT_ERROR':
        return '請求超時';
      case 'NETWORK_ERROR':
        return '網絡連接失敗';
      default:
        return '操作失敗';
    }
  };

  return (
    <Result
      icon={<span style={{ fontSize: '48px' }}>{getErrorIcon(error.code)}</span>}
      title={getErrorTitle(error.code)}
      subTitle={error.message}
      extra={
        <Space direction="vertical" size="middle">
          {onRetry && (
            <Button type="primary" onClick={onRetry}>
              重試
            </Button>
          )}
          
          {showDetails && (
            <Card size="small" className="text-left">
              <Space direction="vertical" size="small" className="w-full">
                <div>
                  <Text strong>錯誤代碼：</Text>
                  <Text code>{error.code}</Text>
                </div>
                <div>
                  <Text strong>狀態碼：</Text>
                  <Text code>{error.statusCode}</Text>
                </div>
                <div>
                  <Text strong>時間：</Text>
                  <Text code>{new Date(error.timestamp).toLocaleString()}</Text>
                </div>
                {error.path && (
                  <div>
                    <Text strong>請求路徑：</Text>
                    <Text code>{error.path}</Text>
                  </div>
                )}
              </Space>
            </Card>
          )}
        </Space>
      }
    />
  );
};

// 錯誤邊界HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// React Hook for error handling
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error) => {
    console.error('🚨 Handled error:', error);
    
    // 可以在這裡添加錯誤上報邏輯
    // reportError(error);
  }, []);

  return { handleError };
}