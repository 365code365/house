import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - 获取单个按钮权限详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    const id = parseInt(params.id)
    
    const buttonPermission = await prisma.buttonPermission.findUnique({
      where: { id },
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
      }
    })

    if (!buttonPermission) {
      return NextResponse.json(
        { success: false, error: '按钮权限不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: buttonPermission
    })

  } catch (error) {
    console.error('获取按钮权限详情失败:', error)
    return NextResponse.json(
      { success: false, error: '获取按钮权限详情失败' },
      { status: 500 }
    )
  }
}

// PUT - 更新按钮权限
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    const id = parseInt(params.id)
    const body = await request.json()
    const { name, identifier, description, menuId, isActive } = body

    // 检查按钮权限是否存在
    const existingPermission = await prisma.buttonPermission.findUnique({
      where: { id }
    })

    if (!existingPermission) {
      return NextResponse.json(
        { success: false, error: '按钮权限不存在' },
        { status: 404 }
      )
    }

    // 如果更新了标识符，检查是否与其他权限冲突
    if (identifier && identifier !== existingPermission.identifier) {
      const conflictPermission = await prisma.buttonPermission.findFirst({
        where: {
          identifier,
          menuId: menuId || existingPermission.menuId,
          id: { not: id }
        }
      })

      if (conflictPermission) {
        return NextResponse.json(
          { success: false, error: '该菜单下已存在相同标识符的权限' },
          { status: 400 }
        )
      }
    }

    // 如果更新了菜单ID，验证菜单是否存在
    if (menuId && menuId !== existingPermission.menuId) {
      const menu = await prisma.menu.findUnique({
        where: { id: parseInt(menuId) }
      })

      if (!menu) {
        return NextResponse.json(
          { success: false, error: '指定的菜单不存在' },
          { status: 400 }
        )
      }
    }

    // 更新按钮权限
    const updatedPermission = await prisma.buttonPermission.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(identifier && { identifier }),
        ...(description !== undefined && { description }),
        ...(menuId && { menuId: parseInt(menuId) }),
        ...(isActive !== undefined && { isActive })
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
      data: updatedPermission,
      message: '按钮权限更新成功'
    })

  } catch (error) {
    console.error('更新按钮权限失败:', error)
    return NextResponse.json(
      { success: false, error: '更新按钮权限失败' },
      { status: 500 }
    )
  }
}

// DELETE - 删除按钮权限
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    const id = parseInt(params.id)

    // 检查按钮权限是否存在
    const existingPermission = await prisma.buttonPermission.findUnique({
      where: { id }
    })

    if (!existingPermission) {
      return NextResponse.json(
        { success: false, error: '按钮权限不存在' },
        { status: 404 }
      )
    }

    // 删除按钮权限（级联删除相关的角色权限关联）
    await prisma.buttonPermission.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '按钮权限删除成功'
    })

  } catch (error) {
    console.error('删除按钮权限失败:', error)
    return NextResponse.json(
      { success: false, error: '删除按钮权限失败' },
      { status: 500 }
    )
  }
}