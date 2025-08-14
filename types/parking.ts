// 停车位类型枚举
export enum ParkingSpaceType {
  FLAT = 'FLAT',                    // 平面
  MECHANICAL_TOP = 'MECHANICAL_TOP', // 机械上层
  MECHANICAL_MID = 'MECHANICAL_MID', // 机械中层
  MECHANICAL_BOT = 'MECHANICAL_BOT', // 机械下层
  MECHANICAL_MOVE = 'MECHANICAL_MOVE', // 机械平移
  MOTORCYCLE = 'MOTORCYCLE',        // 摩托车位
  BICYCLE = 'BICYCLE',              // 脚踏车位
  SELF_BUILT = 'SELF_BUILT',        // 自设车位
  LEGAL = 'LEGAL'                   // 法定车位
}

// 销售状态枚举
export enum ParkingSpaceSalesStatus {
  AVAILABLE = 'AVAILABLE',          // 可售
  DEPOSIT = 'DEPOSIT',              // 订金
  SOLD = 'SOLD',                    // 已售
  NOT_SALE = 'NOT_SALE'             // 不销售
}

// 前端表单数据类型
export interface ParkingFormData {
  parkingNo: string
  type: string
  location: string
  price: number
  salesStatus: string
  buyer?: string
  salesId?: string
  contractDate?: string
}

// API返回的停车位数据类型（与Prisma模型一致）
export interface ParkingSpace {
  id: number
  projectId: number
  parkingNo: string
  type: ParkingSpaceType | null
  location: string | null
  price: number
  salesStatus: ParkingSpaceSalesStatus
  salesDate: Date | null
  buyer: string | null
  salesId: string | null
  remark: string | null
  createdAt: Date
  updatedAt: Date
}

// 停车位统计数据类型
export interface ParkingStats {
  total: number
  available: number
  reserved: number
  sold: number
  totalRevenue: number
}

// 分页参数类型
export interface PaginationParams {
  page: number
  pageSize: number
  total: number
}

// 搜索和筛选参数类型
export interface ParkingSearchParams {
  type?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

// 状态映射类型
export interface StatusMapping {
  [key: string]: string
}

// 类型标签映射
export const TYPE_LABELS: Record<ParkingSpaceType, string> = {
  [ParkingSpaceType.FLAT]: '平面车位',
  [ParkingSpaceType.MECHANICAL_TOP]: '机械上层',
  [ParkingSpaceType.MECHANICAL_MID]: '机械中层',
  [ParkingSpaceType.MECHANICAL_BOT]: '机械下层',
  [ParkingSpaceType.MECHANICAL_MOVE]: '机械移动',
  [ParkingSpaceType.MOTORCYCLE]: '摩托车位',
  [ParkingSpaceType.BICYCLE]: '脚踏车位',
  [ParkingSpaceType.SELF_BUILT]: '自建车位',
  [ParkingSpaceType.LEGAL]: '法定车位'
}

// 状态标签映射
export const STATUS_LABELS: Record<ParkingSpaceSalesStatus, string> = {
  [ParkingSpaceSalesStatus.AVAILABLE]: '可售',
  [ParkingSpaceSalesStatus.DEPOSIT]: '预约',
  [ParkingSpaceSalesStatus.SOLD]: '已售',
  [ParkingSpaceSalesStatus.NOT_SALE]: '不可售'
}

// 状态颜色映射
export const STATUS_COLORS: Record<ParkingSpaceSalesStatus, string> = {
  [ParkingSpaceSalesStatus.AVAILABLE]: 'bg-green-100 text-green-800',
  [ParkingSpaceSalesStatus.DEPOSIT]: 'bg-yellow-100 text-yellow-800',
  [ParkingSpaceSalesStatus.SOLD]: 'bg-red-100 text-red-800',
  [ParkingSpaceSalesStatus.NOT_SALE]: 'bg-gray-100 text-gray-800'
}

// 前端状态值到后端状态值的映射
export const STATUS_MAPPING: Record<string, ParkingSpaceSalesStatus> = {
  'available': ParkingSpaceSalesStatus.AVAILABLE,
  'reserved': ParkingSpaceSalesStatus.DEPOSIT,
  'sold': ParkingSpaceSalesStatus.SOLD,
  'not_sale': ParkingSpaceSalesStatus.NOT_SALE
}

// 后端状态值到前端状态值的映射
export const REVERSE_STATUS_MAPPING: Record<ParkingSpaceSalesStatus, string> = {
  [ParkingSpaceSalesStatus.AVAILABLE]: 'available',
  [ParkingSpaceSalesStatus.DEPOSIT]: 'reserved',
  [ParkingSpaceSalesStatus.SOLD]: 'sold',
  [ParkingSpaceSalesStatus.NOT_SALE]: 'not_sale'
}
