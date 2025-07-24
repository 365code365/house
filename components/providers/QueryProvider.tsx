'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

interface QueryProviderProps {
  children: React.ReactNode
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // 在组件内部创建 QueryClient 实例，确保每个客户端都有独立的实例
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 数据缓存时间 (5分钟)
            staleTime: 5 * 60 * 1000,
            // 缓存保持时间 (10分钟)
            gcTime: 10 * 60 * 1000,
            // 重试次数
            retry: 3,
            // 重试延迟
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // 窗口重新获得焦点时重新获取数据
            refetchOnWindowFocus: true,
            // 网络重新连接时重新获取数据
            refetchOnReconnect: true,
          },
          mutations: {
            // 重试次数
            retry: 1,
            // 重试延迟
            retryDelay: 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 开发环境下显示 React Query DevTools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}