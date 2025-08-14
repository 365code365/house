'use client'

import { Pagination as AntPagination } from 'antd'
import { PaginationProps as AntPaginationProps } from 'antd/es/pagination'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface PaginationProps extends Omit<AntPaginationProps, 'current' | 'pageSize' | 'total' | 'onChange' | 'onShowSizeChange'> {
  pagination: PaginationState
  onPaginationChange: (page: number, pageSize?: number) => void
  className?: string
}

export function Pagination({ 
  pagination, 
  onPaginationChange, 
  className = '',
  ...props 
}: PaginationProps) {
  return (
    <div className={`flex justify-center mt-4 ${className}`}>
      <AntPagination
        current={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        showSizeChanger
        showQuickJumper
        showTotal={(total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`}
        pageSizeOptions={['10', '20', '50', '100']}
        onChange={onPaginationChange}
        onShowSizeChange={onPaginationChange}
        {...props}
      />
    </div>
  )
}

export default Pagination