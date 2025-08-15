import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole } from '@prisma/client'

// 定義路由權限配置
const routePermissions = {
  // 公開路由（無需認證）
  public: [
    '/',
    '/login',
    '/auth/error',
    '/api/auth',
    '/api/auth/*',
    '/_next',
    '/favicon.ico'
  ],
  
  // 需要認證的路由
  protected: {
    // 超級管理員專用路由
    [UserRole.SUPER_ADMIN]: [
      '/admin',
      '/admin/users',
      '/admin/system'
    ],
    
    // 管理員路由
    [UserRole.ADMIN]: [
      '/admin/users',
      '/project/*/settings'
    ],
    
    // 銷售經理路由
    [UserRole.SALES_MANAGER]: [
      '/project/*/sales-control',
      '/project/*/customers',
      '/project/*/appointments',
      '/project/*/parking',
      '/project/*/finance',
      '/project/*/handover',
      '/project/*/statistics'
    ],
    
    // 銷售人員路由
    [UserRole.SALES_PERSON]: [
      '/project/*/sales-control',
      '/project/*/customers',
      '/project/*/appointments',
      '/project/*/parking'
    ],
    
    // 財務人員路由
    [UserRole.FINANCE]: [
      '/project/*/finance',
      '/project/*/customers',
      '/project/*/statistics'
    ],
    
    // 客服人員路由
    [UserRole.CUSTOMER_SERVICE]: [
      '/project/*/customers',
      '/project/*/appointments'
    ],
    
    // 普通用戶路由
    [UserRole.USER]: [
      '/project/*/dashboard'
    ]
  }
}

// 檢查路徑是否匹配模式（支持通配符）
function matchPath(pattern: string, path: string): boolean {
  // 將模式轉換為正則表達式
  const regexPattern = pattern
    .replace(/\*/g, '[^/]+') // * 匹配除 / 外的任意字符
    .replace(/\//g, '\\/') // 轉義 /
  
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(path)
}

// 檢查用戶是否有權限訪問路徑
function hasPermission(userRole: UserRole, pathname: string): boolean {
  // 檢查公開路由
  for (const publicPath of routePermissions.public) {
    if (matchPath(publicPath, pathname)) {
      return true
    }
  }
  
  // 檢查受保護的路由
  const userPermissions = routePermissions.protected[userRole] || []
  
  // 超級管理員有所有權限
  if (userRole === UserRole.SUPER_ADMIN) {
    return true
  }
  
  // 管理員繼承銷售經理權限
  if (userRole === UserRole.ADMIN) {
    const inheritedPermissions = [
      ...userPermissions,
      ...routePermissions.protected[UserRole.SALES_MANAGER]
    ]
    return inheritedPermissions.some(pattern => matchPath(pattern, pathname))
  }
  
  // 銷售經理繼承銷售人員權限
  if (userRole === UserRole.SALES_MANAGER) {
    const inheritedPermissions = [
      ...userPermissions,
      ...routePermissions.protected[UserRole.SALES_PERSON]
    ]
    return inheritedPermissions.some(pattern => matchPath(pattern, pathname))
  }
  
  // 檢查用戶特定權限
  return userPermissions.some(pattern => matchPath(pattern, pathname))
}

// 檢查用戶是否有權限訪問特定項目
function hasProjectAccess(userProjectIds: string | null, projectId: string): boolean {
  if (!userProjectIds) return false
  
  const projectIds = userProjectIds.split(',')
  return projectIds.includes(projectId) || projectIds.includes('*')
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    
    // 檢查是否為公開路由
    for (const publicPath of routePermissions.public) {
      if (matchPath(publicPath, pathname)) {
        return NextResponse.next()
      }
    }
    
    // 如果沒有token且不是公開路由，重定向到登錄頁
    if (!token) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // 檢查賬戶是否激活
    if (!token.isActive) {
      const errorUrl = new URL('/auth/error', req.url)
      errorUrl.searchParams.set('error', 'AccountDisabled')
      return NextResponse.redirect(errorUrl)
    }
    
    // 檢查路由權限
    if (!hasPermission(token.role as UserRole, pathname)) {
      return NextResponse.redirect(new URL('/auth/error?error=AccessDenied', req.url))
    }
    
    // 檢查項目訪問權限
    const projectMatch = pathname.match(/\/project\/([^/]+)/)
    if (projectMatch) {
      const projectId = projectMatch[1]
      if (!hasProjectAccess(token.projectIds, projectId)) {
        return NextResponse.redirect(new URL('/auth/error?error=ProjectAccessDenied', req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // 公開路由始終允許訪問
        for (const publicPath of routePermissions.public) {
          if (matchPath(publicPath, pathname)) {
            return true
          }
        }
        
        // 其他路由需要token
        return !!token
      }
    }
  }
)

// 配置需要中間件保護的路由
export const config = {
  matcher: [
    /*
     * 匹配所有路徑除了:
     * - api/auth (NextAuth.js 路由)
     * - _next/static (靜態文件)
     * - _next/image (圖片優化)
     * - favicon.ico (網站圖標)
     * - public 文件夾中的文件
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)'
  ]
}