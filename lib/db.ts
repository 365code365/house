import { PrismaClient } from '@prisma/client'

// 全域 Prisma Client 實例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma Client 配置選項
const prismaOptions = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] as const : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}

// 創建 Prisma Client 實例
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions)

// 在開發環境中避免重複創建實例
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 資料庫連接測試函數
export async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ 資料庫連接成功')
    return true
  } catch (error) {
    console.error('❌ 資料庫連接失敗:', error)
    return false
  }
}

// 關閉資料庫連接
export async function closeConnection() {
  try {
    await prisma.$disconnect()
    console.log('✅ 資料庫連接已關閉')
  } catch (error) {
    console.error('❌ 關閉資料庫連接時發生錯誤:', error)
  }
}

// 資料庫初始化函數（如果需要的話）
export async function initDatabase() {
  try {
    // 使用 Prisma 的 $executeRaw 來執行原始 SQL（如果需要）
    console.log('✅ 資料庫初始化完成')
    return true
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error)
    return false
  }
}

// 執行原始 SQL 查詢
export async function executeQuery(sql: string, params: any[] = []) {
  try {
    // 使用 Prisma 的 $queryRaw 來執行原始 SQL 查詢
    const result = await prisma.$queryRawUnsafe(sql, ...params)
    return result
  } catch (error) {
    console.error('❌ SQL 查詢執行失敗:', error)
    throw error
  }
}

// TypeScript 類型定義（從 Prisma 自動生成）
export type {
  Company,
  Project,
  SalesPersonnel,
  SalesControl,
  ParkingSpace,
  CustomerAppointment,
  PurchasedCustomer,
  VisitorQuestionnaire,
  WithdrawalRecord,
  BudgetPlan,
  ExpenseManagement,
  CommissionList,
  CommissionDetails,
  DepositManagement,
  HandoverManagement,
} from '@prisma/client'

// 預設導出 Prisma Client
export default prisma