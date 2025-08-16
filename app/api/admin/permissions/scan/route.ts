import { NextRequest, NextResponse } from 'next/server'
import { apiPermissionScanner } from '@/lib/api-permission-scanner'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足，只有超级管理员可以执行此操作' },
        { status: 403 }
      )
    }

    console.log('开始扫描API权限...')
    
    // 执行扫描和保存
    const permissions = await apiPermissionScanner.scanAndSave()
    
    return NextResponse.json({
      success: true,
      message: `成功扫描并保存了 ${permissions.length} 个API权限`,
      data: {
        count: permissions.length,
        permissions: permissions.map(p => ({
          identifier: p.identifier,
          name: p.name,
          method: p.method,
          path: p.path
        }))
      }
    })

  } catch (error) {
    console.error('API权限扫描失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'API权限扫描失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    // 只扫描不保存，用于预览
    const routes = await apiPermissionScanner.scanRoutes()
    const permissions = await apiPermissionScanner.generatePermissions(routes)
    
    return NextResponse.json({
      success: true,
      data: {
        routesCount: routes.length,
        permissionsCount: permissions.length,
        routes: routes.map(r => ({
          path: r.routePath,
          methods: r.methods,
          menuPath: r.menuPath
        })),
        permissions: permissions.map(p => ({
          identifier: p.identifier,
          name: p.name,
          description: p.description,
          method: p.method,
          path: p.path,
          menuPath: p.menuPath
        }))
      }
    })

  } catch (error) {
    console.error('API权限预览失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'API权限预览失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
