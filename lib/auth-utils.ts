import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import { UserRole } from '@prisma/client'
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// API權限配置
const apiPermissions = {
  // 用戶管理API權限
  '/api/users': {
    GET: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    POST: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    PUT: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    DELETE: [UserRole.SUPER_ADMIN]
  },
  
  // 銷控管理API權限
  '/api/sales-control': {
    GET: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON],
    POST: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON],
    PUT: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON],
    DELETE: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER]
  },
  
  // 客戶管理API權限
  '/api/customers': {
    GET: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON, UserRole.CUSTOMER_SERVICE],
    POST: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON, UserRole.CUSTOMER_SERVICE],
    PUT: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON, UserRole.CUSTOMER_SERVICE],
    DELETE: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER]
  },
  
  // 預約管理API權限
  '/api/appointments': {
    GET: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON, UserRole.CUSTOMER_SERVICE],
    POST: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON, UserRole.CUSTOMER_SERVICE],
    PUT: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON, UserRole.CUSTOMER_SERVICE],
    DELETE: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER]
  },
  
  // 停車位管理API權限
  '/api/parking': {
    GET: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON],
    POST: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON],
    PUT: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON],
    DELETE: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER]
  },
  
  // 財務管理API權限
  '/api/finance': {
    GET: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.FINANCE],
    POST: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE],
    PUT: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE],
    DELETE: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
  },
  
  // 交房管理API權限
  '/api/handover': {
    GET: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER],
    POST: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER],
    PUT: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER],
    DELETE: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
  },
  
  // 統計分析API權限
  '/api/statistics': {
    GET: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.FINANCE]
  }
}

// 獲取當前用戶會話
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    return session?.user || null
  } catch (error) {
    console.error('獲取用戶會話失敗:', error)
    return null
  }
}

// 檢查API權限
export async function checkApiPermission(
  request: NextRequest,
  requiredRoles?: UserRole[]
): Promise<{ authorized: boolean; user: any; error?: string }> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return {
        authorized: false,
        user: null,
        error: '未登錄或會話已過期'
      }
    }
    
    if (!user.isActive) {
      return {
        authorized: false,
        user: null,
        error: '賬戶已被禁用'
      }
    }
    
    // 如果指定了必需角色，檢查用戶角色
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        return {
          authorized: false,
          user,
          error: '權限不足'
        }
      }
    } else {
      // 如果沒有指定角色，使用默認API權限配置
      const pathname = new URL(request.url).pathname
      const method = request.method as keyof typeof apiPermissions[keyof typeof apiPermissions]
      
      // 查找匹配的API路徑
      let allowedRoles: UserRole[] = []
      for (const [apiPath, permissions] of Object.entries(apiPermissions)) {
        if (pathname.startsWith(apiPath)) {
          allowedRoles = permissions[method] || []
          break
        }
      }
      
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return {
          authorized: false,
          user,
          error: '權限不足'
        }
      }
    }
    
    return {
      authorized: true,
      user
    }
  } catch (error) {
    console.error('權限檢查失敗:', error)
    return {
      authorized: false,
      user: null,
      error: '權限檢查失敗'
    }
  }
}

// 檢查項目訪問權限
export async function checkProjectAccess(
  userId: string,
  projectId: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { projectIds: true, role: true }
    })
    
    if (!user) return false
    
    // 超級管理員和管理員有所有項目權限
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return true
    }
    
    // 檢查用戶的項目權限
    if (!user.projectIds) return false
    
    const projectIds = user.projectIds.split(',')
    return projectIds.includes(projectId) || projectIds.includes('*')
  } catch (error) {
    console.error('檢查項目權限失敗:', error)
    return false
  }
}

// API權限中間件包裝器
export function withApiAuth(requiredRoles?: UserRole[]) {
  return async function(request: NextRequest) {
    const authResult = await checkApiPermission(request, requiredRoles)
    
    if (!authResult.authorized) {
      return Response.json(
        { error: authResult.error || '權限不足' },
        { status: authResult.user ? 403 : 401 }
      )
    }
    
    return authResult.user
  }
}

// 創建受保護的API處理器
export function createProtectedApiHandler(
  handler: (request: NextRequest, context: any) => Promise<Response>,
  requiredRoles?: UserRole[]
) {
  return async function(request: NextRequest, context?: any) {
    const authResult = await checkApiPermission(request, requiredRoles)
    
    if (!authResult.authorized) {
      return Response.json(
        { error: authResult.error || '權限不足' },
        { status: authResult.user ? 403 : 401 }
      )
    }
    
    // 將用戶信息添加到context中，保持原有的context結構
    const enhancedContext = {
      ...context,
      user: authResult.user
    }
    
    return handler(request, enhancedContext)
  }
}

// 角色權限檢查工具
export const rolePermissions = {
  // 檢查是否為管理員角色
  isAdmin: (role: UserRole): boolean => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role as any)
  },
  
  // 檢查是否為銷售相關角色
  isSales: (role: UserRole): boolean => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON].includes(role as any)
  },
  
  // 檢查是否為財務相關角色
  isFinance: (role: UserRole): boolean => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE].includes(role as any)
  },
  
  // 檢查是否為客服相關角色
  isCustomerService: (role: UserRole): boolean => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_PERSON, UserRole.CUSTOMER_SERVICE].includes(role as any)
  },
  
  // 檢查是否有特定權限
  hasPermission: (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
    return requiredRoles.includes(userRole)
  }
}

export default {
  getCurrentUser,
  checkApiPermission,
  checkProjectAccess,
  withApiAuth,
  createProtectedApiHandler,
  rolePermissions
}