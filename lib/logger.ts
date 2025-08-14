// 日誌級別枚舉
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// 日誌條目接口
export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  context?: {
    method?: string;
    url?: string;
    userAgent?: string;
    ip?: string;
    userId?: string;
    projectId?: string;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
    statusCode?: number;
    code?: string;
    details?: any;
  };
  metadata?: Record<string, any>;
}

// 日誌記錄器類
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  // 記錄錯誤日誌
  error(message: string, error?: Error, context?: any, metadata?: Record<string, any>) {
    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      timestamp: new Date().toISOString(),
      message,
      context,
      metadata,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as any).statusCode && { statusCode: (error as any).statusCode },
        ...(error as any).code && { code: (error as any).code },
        ...(error as any).details && { details: (error as any).details },
      };
    }

    this.writeLog(logEntry);
  }

  // 記錄警告日誌
  warn(message: string, context?: any, metadata?: Record<string, any>) {
    const logEntry: LogEntry = {
      level: LogLevel.WARN,
      timestamp: new Date().toISOString(),
      message,
      context,
      metadata,
    };

    this.writeLog(logEntry);
  }

  // 記錄信息日誌
  info(message: string, context?: any, metadata?: Record<string, any>) {
    const logEntry: LogEntry = {
      level: LogLevel.INFO,
      timestamp: new Date().toISOString(),
      message,
      context,
      metadata,
    };

    this.writeLog(logEntry);
  }

  // 記錄調試日誌
  debug(message: string, context?: any, metadata?: Record<string, any>) {
    // 只在開發環境記錄調試日誌
    if (!this.isDevelopment) return;

    const logEntry: LogEntry = {
      level: LogLevel.DEBUG,
      timestamp: new Date().toISOString(),
      message,
      context,
      metadata,
    };

    this.writeLog(logEntry);
  }

  // 寫入日誌
  private writeLog(logEntry: LogEntry) {
    // 開發環境：輸出到控制台
    if (this.isDevelopment) {
      this.logToConsole(logEntry);
    }

    // 生產環境：發送到外部日誌服務
    if (this.isProduction) {
      this.logToExternalService(logEntry);
    }

    // 寫入本地文件（可選）
    this.logToFile(logEntry);
  }

  // 控制台輸出
  private logToConsole(logEntry: LogEntry) {
    const { level, timestamp, message, context, error, metadata } = logEntry;
    
    const logData = {
      timestamp,
      message,
      ...(context && { context }),
      ...(error && { error }),
      ...(metadata && { metadata }),
    };

    switch (level) {
      case LogLevel.ERROR:
        console.error(`🔴 [ERROR] ${message}`, logData);
        break;
      case LogLevel.WARN:
        console.warn(`🟡 [WARN] ${message}`, logData);
        break;
      case LogLevel.INFO:
        console.info(`🔵 [INFO] ${message}`, logData);
        break;
      case LogLevel.DEBUG:
        console.debug(`⚪ [DEBUG] ${message}`, logData);
        break;
    }
  }

  // 發送到外部日誌服務
  private async logToExternalService(logEntry: LogEntry) {
    try {
      // TODO: 集成外部日誌服務
      // 例如：Sentry, LogRocket, DataDog, CloudWatch 等
      
      // Sentry 示例（需要安裝 @sentry/nextjs）
      // if (logEntry.level === LogLevel.ERROR && logEntry.error) {
      //   Sentry.captureException(new Error(logEntry.message), {
      //     contexts: {
      //       api: logEntry.context,
      //     },
      //     extra: logEntry.metadata,
      //   });
      // }

      // 自定義日誌服務 API 調用示例
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry),
      // });
    } catch (error) {
      // 避免日誌記錄本身出錯影響主流程
      console.error('Failed to send log to external service:', error);
    }
  }

  // 寫入本地文件
  private async logToFile(logEntry: LogEntry) {
    try {
      // 在 Node.js 環境中可以寫入文件
      // 注意：Next.js 的 API 路由運行在 Node.js 環境中
      if (typeof window === 'undefined') {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const logDir = path.join(process.cwd(), 'logs');
        const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
        
        // 確保日誌目錄存在
        try {
          await fs.access(logDir);
        } catch {
          await fs.mkdir(logDir, { recursive: true });
        }
        
        // 寫入日誌
        const logLine = JSON.stringify(logEntry) + '\n';
        await fs.appendFile(logFile, logLine, 'utf8');
      }
    } catch (error) {
      // 避免文件寫入錯誤影響主流程
      console.error('Failed to write log to file:', error);
    }
  }

  // API 請求日誌記錄輔助方法
  logApiRequest(method: string, url: string, statusCode: number, duration: number, context?: any) {
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;
    
    if (statusCode >= 500) {
      this.error(message, undefined, context);
    } else if (statusCode >= 400) {
      this.warn(message, context);
    } else {
      this.info(message, context);
    }
  }

  // 數據庫操作日誌記錄
  logDatabaseOperation(operation: string, table: string, duration: number, error?: Error) {
    const message = `Database ${operation} on ${table} (${duration}ms)`;
    
    if (error) {
      this.error(message, error, { operation, table, duration });
    } else {
      this.debug(message, { operation, table, duration });
    }
  }
}

// 導出單例實例
export const logger = new Logger();

// 導出便捷函數
export const logError = (message: string, error?: Error, context?: any, metadata?: Record<string, any>) => {
  logger.error(message, error, context, metadata);
};

export const logWarn = (message: string, context?: any, metadata?: Record<string, any>) => {
  logger.warn(message, context, metadata);
};

export const logInfo = (message: string, context?: any, metadata?: Record<string, any>) => {
  logger.info(message, context, metadata);
};

export const logDebug = (message: string, context?: any, metadata?: Record<string, any>) => {
  logger.debug(message, context, metadata);
};