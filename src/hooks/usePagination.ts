'use client'

import { useState, useCallback } from 'react'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  initialTotal?: number
}

export interface UsePaginationReturn {
  pagination: PaginationState
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>
  handlePaginationChange: (page: number, pageSize?: number) => void
  setTotal: (total: number) => void
  reset: () => void
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 10,
    initialTotal = 0
  } = options

  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    pageSize: initialPageSize,
    total: initialTotal
  })

  const handlePaginationChange = useCallback((page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      page,
      pageSize: pageSize || prev.pageSize
    }))
  }, [])

  const setTotal = useCallback((total: number) => {
    setPagination(prev => ({ ...prev, total }))
  }, [])

  const reset = useCallback(() => {
    setPagination({
      page: initialPage,
      pageSize: initialPageSize,
      total: initialTotal
    })
  }, [initialPage, initialPageSize, initialTotal])

  return {
    pagination,
    setPagination,
    handlePaginationChange,
    setTotal,
    reset
  }
}

export default usePagination