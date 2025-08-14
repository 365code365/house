import { QueryClient } from '@tanstack/react-query'

// 创建 QueryClient 实例
export const queryClient = new QueryClient({
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

// 查询键工厂
export const queryKeys = {
  // 销控数据相关
  salesControl: {
    all: ['sales-control'] as const,
    lists: () => [...queryKeys.salesControl.all, 'list'] as const,
    list: (projectId: number, filters?: any, pagination?: any) => 
      [...queryKeys.salesControl.lists(), projectId, filters, pagination] as const,
    detail: (id: number) => [...queryKeys.salesControl.all, 'detail', id] as const,
    stats: (projectId: number) => [...queryKeys.salesControl.all, 'stats', projectId] as const,
  },
  // 项目数据相关
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.projects.lists(), filters] as const,
    detail: (id: number) => [...queryKeys.projects.all, 'detail', id] as const,
  },
  // 销售人员相关
  salesPersonnel: {
    all: ['sales-personnel'] as const,
    lists: () => [...queryKeys.salesPersonnel.all, 'list'] as const,
    list: (projectId?: number) => 
      [...queryKeys.salesPersonnel.lists(), projectId] as const,
  },
  // 停车位相关
  parking: {
    all: ['parking'] as const,
    lists: () => [...queryKeys.parking.all, 'list'] as const,
    list: (projectId: number, filters?: any) => 
      [...queryKeys.parking.lists(), projectId, filters] as const,
  },
}

// 无效化查询的辅助函数
export const invalidateQueries = {
  salesControl: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.salesControl.all }),
    list: (projectId: number) => 
      queryClient.invalidateQueries({ queryKey: queryKeys.salesControl.lists() }),
  },
  projects: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
  },
  salesPersonnel: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.salesPersonnel.all }),
  },
  parking: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.parking.all }),
  },
}