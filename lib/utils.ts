import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化日期
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 格式化日期時間
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化金額
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return ''
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

// 格式化數字
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return ''
  return new Intl.NumberFormat('zh-TW').format(num)
}

// 驗證手機號碼
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^09[0-9]{2}-?[0-9]{3}-?[0-9]{3}$/
  return phoneRegex.test(phone)
}

// 驗證電子郵件
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 計算溢價率
export function calculatePremiumRate(unitPrice: number, basePrice: number): number {
  if (!basePrice || basePrice === 0) return 0
  return ((unitPrice - basePrice) / basePrice) * 100
}

// 計算執行率
export function calculateExecutionRate(actualExpense: number, budget: number): number {
  if (!budget || budget === 0) return 0
  return (actualExpense / budget) * 100
}

// 生成房型編號
export function generateHouseNo(floor: number, building: string, unit: string): string {
  return `${floor}${building}${unit}`
}

// 解析房型編號
export function parseHouseNo(houseNo: string): { floor: number; building: string; unit: string } | null {
  const match = houseNo.match(/^(\d+)([A-Z]+)([A-Z0-9]+)$/)
  if (!match) return null
  
  return {
    floor: parseInt(match[1]),
    building: match[2],
    unit: match[3]
  }
}

// 深拷貝對象
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any }
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj as T
  }
  return obj
}

// 防抖函數
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 節流函數
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 生成隨機ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// 檢查是否為空值
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// 安全的JSON解析
export function safeJsonParse<T>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return defaultValue
  }
}

// 下載文件
export function downloadFile(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// 獲取文件擴展名
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// 檢查文件類型
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const extension = getFileExtension(filename).toLowerCase()
  return imageExtensions.includes(extension)
}

export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename).toLowerCase() === 'pdf'
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}