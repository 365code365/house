import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - 获取按钮权限列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const menuId = searchParams.get('menuId')

    let whereClause = {}
    if (menuId) {
      whereClause = { menuId: parseInt(menuId) }
    }

    const buttonPermissions = await prisma.buttonPermission.findMany({
      where: whereClause,
      include: {
        menu: {
          select: {
            id: true,
            name: true,
            displayName: true,
            path: true
          }
        },
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: [
        { menuId: 'asc' },
        { identifier: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: buttonPermissions
    })

  } catch (error) {
    console.error('获取按钮权限失败:', error)
    return NextResponse.json(
      { success: false, error: '获取按钮权限失败' },
      { status: 500 }
    )
  }
}

// POST - 创建按钮权限
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, identifier, description, menuId, isActive = true } = body

    // 验证必填字段
    if (!name || !identifier || !menuId) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 检查标识符是否已存在
    const existingPermission = await prisma.buttonPermission.findFirst({
      where: {
        identifier,
        menuId: parseInt(menuId)
      }
    })

    if (existingPermission) {
      return NextResponse.json(
        { success: false, error: '该菜单下已存在相同标识符的权限' },
        { status: 400 }
      )
    }

    // 验证菜单是否存在
    const menu = await prisma.menu.findUnique({
      where: { id: parseInt(menuId) }
    })

    if (!menu) {
      return NextResponse.json(
        { success: false, error: '指定的菜单不存在' },
        { status: 400 }
      )
    }

    // 创建按钮权限
    const buttonPermission = await prisma.buttonPermission.create({
      data: {
        name,
        identifier,
        description,
        menuId: parseInt(menuId),
        isActive
      },
      include: {
        menu: {
          select: {
            id: true,
            name: true,
            displayName: true,
            path: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: buttonPermission,
      message: '按钮权限创建成功'
    })

  } catch (error) {
    console.error('创建按钮权限失败:', error)
    return NextResponse.json(
      { success: false, error: '创建按钮权限失败' },
      { status: 500 }
    )
  }
}

// PUT - 批量更新按钮权限状态
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { ids, isActive } = body

    if (!ids || !Array.isArray(ids) || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: '参数格式错误' },
        { status: 400 }
      )
    }

    // 批量更新
    const result = await prisma.buttonPermission.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      message: `成功更新 ${result.count} 个按钮权限`,
      data: { updatedCount: result.count }
    })

  } catch (error) {
    console.error('批量更新按钮权限失败:', error)
    return NextResponse.json(
      { success: false, error: '批量更新按钮权限失败' },
      { status: 500 }
    )
  }
}