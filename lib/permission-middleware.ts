import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface PermissionCheckOptions {
  requiredPermission?: string
  allowedRoles?: string[]
  skipPermissionCheck?: boolean
}

/**
 * 权限验证中间件
 */
export async function withPermissionCheck(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: PermissionCheckOptions = {}
) {
  return async (req: NextRequest, context: any = {}) => {
    try {
      // 获取用户会话
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: '未授权访问，请先登录' },
          { status: 401 }
        )
      }

      const user = session.user

      // 检查角色权限
      if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: '权限不足，角色不匹配' },
          { status: 403 }
        )
      }

      // 超级管理员跳过权限检查
      if (user.role === 'SUPER_ADMIN' || options.skipPermissionCheck) {
        return await handler(req, { ...context, user })
      }

      // 检查具体的按钮权限
      if (options.requiredPermission) {
        const hasPermission = await checkUserPermission(user.id, options.requiredPermission)
        
        if (!hasPermission) {
          return NextResponse.json(
            { 
              success: false, 
              error: '权限不足，缺少必要的操作权限',
              requiredPermission: options.requiredPermission
            },
            { status: 403 }
          )
        }
      }

      // 权限验证通过，执行原始处理器
      return await handler(req, { ...context, user })

    } catch (error) {
      console.error('权限验证中间件错误:', error)
      return NextResponse.json(
        { success: false, error: '权限验证失败' },
        { status: 500 }
      )
    }
  }
}

/**
 * 检查用户是否有特定权限
 */
export async function checkUserPermission(userId: number, permissionIdentifier: string): Promise<boolean> {
  try {
    // 获取用户的角色
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user) return false

    // 超级管理员有所有权限
    if (user.role === 'SUPER_ADMIN') return true

    // 根据角色名查找角色ID
    const role = await prisma.role.findFirst({
      where: { name: user.role }
    })

    if (!role) return false

    // 查找权限
    const permission = await prisma.buttonPermission.findFirst({
      where: { identifier: permissionIdentifier }
    })

    if (!permission) return false

    // 检查角色是否有该权限
    const rolePermission = await prisma.roleButtonPermission.findFirst({
      where: {
        roleId: role.id,
        buttonId: permission.id,
        canOperate: true
      }
    })

    return !!rolePermission

  } catch (error) {
    console.error('检查用户权限失败:', error)
    return false
  }
}

/**
 * 根据请求路径和方法生成权限标识符
 */
export function generatePermissionIdentifier(path: string, method: string): string {
  // 移除查询参数和片段
  const cleanPath = path.split('?')[0].split('#')[0]
  
  // 将路径转换为标识符格式
  let identifier = cleanPath
    .replace(/^\/api/, '') // 移除 /api 前缀
    .replace(/\/\d+/g, '/_id') // 数字ID -> _id
    .replace(/\//g, '_') // 路径分隔符 / -> _
    .replace(/^_/, '') // 移除开头的下划线
    .replace(/_+/g, '_') // 多个下划线合并为一个

  return `${method.toLowerCase()}_${identifier}`.toLowerCase()
}

/**
 * 自动权限检查装饰器
 * 根据请求路径和方法自动生成权限标识符
 */
export function withAutoPermissionCheck(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: Omit<PermissionCheckOptions, 'requiredPermission'> & { 
    customPermissionGenerator?: (req: NextRequest) => string 
  } = {}
) {
  return async (req: NextRequest, context: any = {}) => {
    let requiredPermission: string | undefined

    if (!options.skipPermissionCheck) {
      if (options.customPermissionGenerator) {
        requiredPermission = options.customPermissionGenerator(req)
      } else {
        const method = req.method
        const pathname = req.nextUrl.pathname
        requiredPermission = generatePermissionIdentifier(pathname, method)
      }
    }

    return withPermissionCheck(handler, {
      ...options,
      requiredPermission
    })(req, context)
  }
}

/**
 * 批量权限检查
 */
export async function checkMultiplePermissions(
  userId: number, 
  permissionIdentifiers: string[]
): Promise<{ [key: string]: boolean }> {
  const results: { [key: string]: boolean } = {}
  
  for (const identifier of permissionIdentifiers) {
    results[identifier] = await checkUserPermission(userId, identifier)
  }
  
  return results
}

/**
 * 获取用户所有权限
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user) return []

    // 超级管理员返回所有权限
    if (user.role === 'SUPER_ADMIN') {
      const allPermissions = await prisma.buttonPermission.findMany({
        select: { identifier: true }
      })
      return allPermissions.map(p => p.identifier)
    }

    // 根据角色获取权限
    const role = await prisma.role.findFirst({
      where: { name: user.role },
      include: {
        buttonPermissions: {
          where: { canOperate: true },
          include: {
            button: {
              select: { identifier: true }
            }
          }
        }
      }
    })

    if (!role) return []

    return role.buttonPermissions.map(rp => rp.button.identifier)

  } catch (error) {
    console.error('获取用户权限失败:', error)
    return []
  }
}
