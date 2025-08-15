import type { WithdrawalRecord as PrismaWithdrawalRecord, WithdrawalRecordStatus } from '@prisma/client'

// 重新導出 WithdrawalRecord 類型
export type WithdrawalRecord = PrismaWithdrawalRecord

// 退戶記錄表單數據類型
export interface WithdrawalFormData {
  customerName: string
  building: string
  floor: string
  unit: string
  houseType: string
  originalPrice: number
  paidAmount: number
  refundAmount: number
  reason: string
  withdrawalDate: string
  status: WithdrawalRecordStatus
  remark?: string
}

// 退戶記錄創建請求類型
export interface CreateWithdrawalRequest {
  customerName: string
  building: string
  floor: string
  unit: string
  houseType: string
  originalPrice: number
  paidAmount: number
  refundAmount: number
  reason: string
  withdrawalDate: string
  status: WithdrawalRecordStatus
  remark?: string
}

// 退戶記錄更新請求類型
export interface UpdateWithdrawalRequest extends Partial<CreateWithdrawalRequest> {
  id: string
}

// 退戶記錄查詢參數類型
export interface WithdrawalQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: WithdrawalRecordStatus
  reason?: string
  building?: string
  startDate?: string
  endDate?: string
  sortBy?: 'withdrawalDate' | 'customerName' | 'refundAmount'
  sortOrder?: 'asc' | 'desc'
}

// 退戶記錄列表響應類型
export interface WithdrawalListResponse {
  data: WithdrawalRecord[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// 退戶記錄統計類型
export interface WithdrawalStats {
  totalRecords: number
  totalRefundAmount: number
  statusCounts: {
    [key in WithdrawalRecordStatus]: number
  }
  monthlyStats: {
    month: string
    count: number
    refundAmount: number
  }[]
}

// 退戶原因選項
export const WITHDRAWAL_REASONS = [
  '個人因素',
  '經濟因素',
  '房屋品質問題',
  '交屋延遲',
  '合約糾紛',
  '投資考量',
  '其他'
] as const

// 退戶狀態選項
export const WITHDRAWAL_STATUS_OPTIONS = [
  { value: 'APPLIED', label: '已申請', color: 'blue' },
  { value: 'PROCESSING', label: '處理中', color: 'orange' },
  { value: 'COMPLETED', label: '已完成', color: 'green' },
  { value: 'CANCELLED', label: '已取消', color: 'red' }
] as const

// 退戶記錄表格列配置
export interface WithdrawalTableColumn {
  key: string
  title: string
  dataIndex: string
  width?: number
  sorter?: boolean
  render?: (value: any, record: WithdrawalRecord) => React.ReactNode
}

// PDF導出配置
export interface WithdrawalPDFConfig {
  title: string
  subtitle?: string
  includeStats: boolean
  includeChart: boolean
  dateRange?: {
    start: string
    end: string
  }
}