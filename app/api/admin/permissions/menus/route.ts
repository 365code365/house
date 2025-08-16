import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { withApiAuth } from '@/lib/auth-utils';
import { successResponse, errorResponse } from '@/lib/api-response';

// 獲取菜單權限配置
export async function GET(request: NextRequest) {
  try {
    // 獲取session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }
    
    // 檢查用戶角色
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: '權限不足' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // 增加默認限制
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';
    
    const skip = (page - 1) * limit;
    
    // 構建查詢條件
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { path: { contains: search } },
        { component: { contains: search } }
      ];
    }
    
    // 獲取菜單列表 - 移除分頁以確保父子關聯正確
    const [menus, total] = await Promise.all([
      prisma.menu.findMany({
        where,
        orderBy: [
          { parentId: 'asc' },
          { sortOrder: 'asc' }
        ],
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          },
          children: {
            orderBy: { sortOrder: 'asc' },
            include: {
              parent: {
                select: {
                  id: true,
                  name: true,
                  displayName: true
                }
              },
              buttonPermissions: {
                select: {
                  id: true,
                  name: true,
                  identifier: true,
                  description: true,
                  isActive: true,
                  createdAt: true,
                  updatedAt: true
                }
              }
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
          },
          buttonPermissions: {
            select: {
              id: true,
              name: true,
              identifier: true,
              description: true,
              isActive: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      }),
      prisma.menu.count({ where })
    ]);
    
    // 如果有角色篩選，獲取該角色的菜單權限
    let roleMenus: any[] = [];
    if (roleFilter) {
      const roleMenuPermissions = await prisma.roleMenuPermission.findMany({
        where: { role: roleFilter as UserRole },
        include: { menu: true }
      });
      roleMenus = roleMenuPermissions.map(rmp => rmp.menu);
    }
    
    return NextResponse.json({
      data: menus,
      pagination: {
        page,
        limit,
        total: Number(total),
        pages: Math.ceil(Number(total) / limit)
      },
      roleMenus: roleFilter ? roleMenus : undefined
    });
  } catch (error) {
    console.error('獲取菜單權限配置失敗:', error);
    return NextResponse.json(
      { error: '獲取菜單權限配置失敗' },
      { status: 500 }
    );
  }
}

// POST /api/admin/permissions/menus - 創建新菜單
export async function POST(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { 
        name, 
        path, 
        icon, 
        parentId, 
        sortOrder = 0, 
        isVisible = true, 
        description 
      } = body;

      // 驗證必填字段
      if (!name || !path) {
        return errorResponse('菜單名稱和路徑為必填項', 400);
      }

      // 檢查菜單名稱是否已存在
      const existingMenu = await prisma.menu.findFirst({
        where: { name }
      });

      if (existingMenu) {
        return errorResponse('菜單名稱已存在', 400);
      }

      // 如果有父菜單，檢查父菜單是否存在
      if (parentId) {
        const parentMenu = await prisma.menu.findUnique({
          where: { id: parentId }
        });

        if (!parentMenu) {
          return errorResponse('父菜單不存在', 400);
        }
      }

      // 創建新菜單
      const newMenu = await prisma.menu.create({
        data: {
          name,
          path,
          icon,
          parentId,
          sortOrder: sortOrder || 0
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          resourceType: 'menu',
          resourceId: newMenu.id,
          afterData: JSON.stringify(newMenu),
          description: `創建菜單: ${name}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: newMenu,
        message: '菜單創建成功'
      });
    } catch (error) {
      console.error('創建菜單失敗:', error);
      return errorResponse('創建菜單失敗', 500);
    }
  });
}

// PUT /api/admin/permissions/menus - 批量更新菜單權限
export async function PUT(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { roleId, menuPermissions } = body;

      if (!roleId || !Array.isArray(menuPermissions)) {
        return errorResponse('角色ID和菜單權限配置為必填項', 400);
      }

      // 檢查角色是否存在
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        return errorResponse('角色不存在', 400);
      }

      // 獲取原有權限配置
      const originalPermissions = await prisma.roleMenuPermission.findMany({
        where: { roleId }
      });

      // 開始事務操作
      await prisma.$transaction(async (tx) => {
        // 刪除原有權限
        await tx.roleMenuPermission.deleteMany({
          where: { roleId }
        });

        // 創建新權限
        if (menuPermissions.length > 0) {
          await tx.roleMenuPermission.createMany({
            data: menuPermissions.map((permission: any) => ({
              roleId,
              menuId: permission.menuId,
              canView: permission.canView || false,
              canCreate: permission.canCreate || false,
              canUpdate: permission.canUpdate || false,
              canDelete: permission.canDelete || false
            }))
          });
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          resourceType: 'menu_permission',
          resourceId: roleId,
          beforeData: JSON.stringify(originalPermissions),
          afterData: JSON.stringify(menuPermissions),
          description: `更新角色 ${role.name} 的菜單權限`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        message: '菜單權限更新成功'
      });
    } catch (error) {
      console.error('更新菜單權限失敗:', error);
      return errorResponse('更新菜單權限失敗', 500);
    }
  });
}

// DELETE /api/admin/permissions/menus - 批量刪除菜單
export async function DELETE(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const menuIdsParam = searchParams.get('ids');
      
      if (!menuIdsParam) {
        return errorResponse('請提供要刪除的菜單ID', 400);
      }

      const menuIds = menuIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      
      if (menuIds.length === 0) {
        return errorResponse('無效的菜單ID', 400);
      }

      // 檢查是否有子菜單
      const childMenus = await prisma.menu.findMany({
        where: {
          parentId: { in: menuIds }
        }
      });

      if (childMenus.length > 0) {
        return errorResponse('請先刪除子菜單', 400);
      }

      // 獲取要刪除的菜單信息
      const menusToDelete = await prisma.menu.findMany({
        where: { id: { in: menuIds } }
      });

      // 刪除菜單（級聯刪除相關權限）
      const deletedMenus = await prisma.menu.deleteMany({
        where: {
          id: { in: menuIds }
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'BATCH_DELETE',
          resourceType: 'menu',
          resourceId: 0, // 批量操作使用0
          beforeData: JSON.stringify(menusToDelete),
          description: `批量刪除菜單: ${menusToDelete.map(m => m.name).join(', ')}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: { count: deletedMenus.count },
        message: `成功刪除 ${deletedMenus.count} 個菜單`
      });
    } catch (error) {
      console.error('批量刪除菜單失敗:', error);
      return errorResponse('批量刪除菜單失敗', 500);
    }
  });
}