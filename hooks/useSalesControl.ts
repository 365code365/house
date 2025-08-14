import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'
import type { SalesControlData } from '@/components/sales-control/SalesControlTable'

// 获取销控数据的hook
export function useSalesControlData(projectId: number, filters?: any, pagination?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: queryKeys.salesControl.list(projectId, filters, pagination),
    queryFn: async () => {
      const params = new URLSearchParams()
      
      // 添加分页参数
      if (pagination) {
        if (pagination.page) params.append('page', pagination.page.toString())
        if (pagination.pageSize) params.append('pageSize', pagination.pageSize.toString())
      }
      
      if (filters) {
        // 处理基本筛选条件
        Object.entries(filters).forEach(([key, value]: [string, any]) => {
          if (key === 'priceRange' && Array.isArray(value)) {
            params.append('minPrice', value[0].toString())
            params.append('maxPrice', value[1].toString())
          } else if (key === 'areaRange' && Array.isArray(value)) {
            params.append('minArea', value[0].toString())
            params.append('maxArea', value[1].toString())
          } else if (key === 'dateRange' && Array.isArray(value)) {
            if (value[0]) params.append('startDate', value[0].format('YYYY-MM-DD'))
            if (value[1]) params.append('endDate', value[1].format('YYYY-MM-DD'))
          } else if (value && typeof value === 'string') {
            params.append(key, value)
          }
        })
      }

      const response = await fetch(`/api/projects/${projectId}/sales-control?${params}`)
      if (!response.ok) {
        throw new Error('获取销控数据失败')
      }
      const result = await response.json()
      return result
    },
    enabled: !!projectId,
    // 每30秒自动刷新数据
    refetchInterval: 30 * 1000,
    // 当窗口重新获得焦点时刷新
    refetchOnWindowFocus: true,
  })
}

// 更新销控数据的hook
export function useUpdateSalesControl(projectId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { id: number; updates: Partial<SalesControlData> }) => {
      const response = await fetch(`/api/projects/${projectId}/sales-control/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.updates),
      })
      
      if (!response.ok) {
        throw new Error('更新销控数据失败')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // 更新成功后，无效化相关查询以触发重新获取
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.salesControl.lists() 
      })
    },
    onError: (error) => {
      console.error('更新销控数据失败:', error)
    },
  })
}

// 批量更新销控数据的hook
export function useBatchUpdateSalesControl(projectId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { ids: number[]; updates: Partial<SalesControlData> }) => {
      const response = await fetch(`/api/projects/${projectId}/sales-control/batch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('批量更新销控数据失败')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // 更新成功后，无效化相关查询以触发重新获取
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.salesControl.lists() 
      })
    },
    onError: (error) => {
      console.error('批量更新销控数据失败:', error)
    },
  })
}

// 删除销控数据的hook
export function useDeleteSalesControl(projectId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/projects/${projectId}/sales-control/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('删除销控数据失败')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // 删除成功后，无效化相关查询以触发重新获取
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.salesControl.lists() 
      })
    },
    onError: (error) => {
      console.error('删除销控数据失败:', error)
    },
  })
}

// 创建新销控数据的hook
export function useCreateSalesControl(projectId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Omit<SalesControlData, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await fetch(`/api/projects/${projectId}/sales-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('创建销控数据失败')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // 创建成功后，无效化相关查询以触发重新获取
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.salesControl.lists() 
      })
    },
    onError: (error) => {
      console.error('创建销控数据失败:', error)
    },
  })
}

// 获取销控统计数据的hook
export const useSalesControlStats = (projectId: number) => {
  return useQuery({
    queryKey: queryKeys.salesControl.stats(projectId),
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/sales-control/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch sales control stats')
      }
      const result = await response.json()
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}