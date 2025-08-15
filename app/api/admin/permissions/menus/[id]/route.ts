import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { withApiAuth } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/admin/permissions/menus/[id] - 獲取單個菜單詳情
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const menuId = parseInt(params.id);
      
      if (isNaN(menuId)) {
        return errorResponse('無效的菜單ID', 400);
      }

      const menu = await prisma.menu.findUnique({
        where: { id: menuId },
        include: {
          parent: true,
          children: {
            orderBy: { sortOrder: 'asc' }
          },
          rolePermissions: {
            include: {
              role: true
            }
          }
        }
      });

      if (!menu) {
        return errorResponse('菜單不存在', 404);
      }

      return successResponse({
        data: menu
      });
    } catch (error) {
      console.error('獲取菜單詳情失敗:', error);
      return errorResponse('獲取菜單詳情失敗', 500);
    }
  });
}

// PUT /api/admin/permissions/menus/[id] - 更新菜單信息
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const menuId = parseInt(params.id);
      
      if (isNaN(menuId)) {
        return errorResponse('無效的菜單ID', 400);
      }

      const body = await request.json();
      const { 
        name, 
        displayName, 
        path, 
        icon, 
        parentId, 
        sortOrder, 
        isVisible, 
        description 
      } = body;

      // 驗證必填字段
      if (!displayName) {
        return errorResponse('顯示名稱為必填項', 400);
      }

      // 獲取原始菜單信息
      const originalMenu = await prisma.menu.findUnique({
        where: { id: menuId }
      });

      if (!originalMenu) {
        return errorResponse('菜單不存在', 404);
      }

      // 如果要修改名稱，檢查新名稱是否已存在
      if (name && name !== originalMenu.name) {
        const existingMenu = await prisma.menu.findFirst({
          where: { 
            name,
            id: { not: menuId }
          }
        });

        if (existingMenu) {
          return errorResponse('菜單名稱已存在', 400);
        }
      }

      // 如果要修改父菜單，檢查是否會造成循環引用
      if (parentId && parentId !== originalMenu.parentId) {
        // 檢查父菜單是否存在
        const parentMenu = await prisma.menu.findUnique({
          where: { id: parentId }
        });

        if (!parentMenu) {
          return errorResponse('父菜單不存在', 400);
        }

        // 檢查是否會造成循環引用（簡單檢查：父菜單不能是當前菜單的子菜單）
        const checkCircularReference = async (checkParentId: number): Promise<boolean> => {
          if (checkParentId === menuId) {
            return true; // 發現循環引用
          }
          
          const parent = await prisma.menu.findUnique({
            where: { id: checkParentId }
          });
          
          if (parent && parent.parentId) {
            return await checkCircularReference(parent.parentId);
          }
          
          return false;
        };

        if (await checkCircularReference(parentId)) {
          return errorResponse('不能將菜單設置為其子菜單的子菜單', 400);
        }
      }

      // 更新菜單
      const updatedMenu = await prisma.menu.update({
        where: { id: menuId },
        data: {
          ...(name && { name }),
          displayName,
          ...(path !== undefined && { path }),
          ...(icon !== undefined && { icon }),
          ...(parentId !== undefined && { parentId }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(isVisible !== undefined && { isVisible }),
          ...(description !== undefined && { description })
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          resourceType: 'menu',
          resourceId: menuId,
          beforeData: JSON.stringify(originalMenu),
          afterData: JSON.stringify(updatedMenu),
          description: `更新菜單: ${updatedMenu.name}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: updatedMenu,
        message: '菜單更新成功'
      });
    } catch (error) {
      console.error('更新菜單失敗:', error);
      return errorResponse('更新菜單失敗', 500);
    }
  });
}

// DELETE /api/admin/permissions/menus/[id] - 刪除菜單
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const menuId = parseInt(params.id);
      
      if (isNaN(menuId)) {
        return errorResponse('無效的菜單ID', 400);
      }

      // 獲取菜單信息
      const menu = await prisma.menu.findUnique({
        where: { id: menuId },
        include: {
          children: true
        }
      });

      if (!menu) {
        return errorResponse('菜單不存在', 404);
      }

      // 檢查是否有子菜單
      if (menu.children.length > 0) {
        return errorResponse('請先刪除子菜單', 400);
      }

      // 刪除菜單（級聯刪除相關權限）
      await prisma.menu.delete({
        where: { id: menuId }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          resourceType: 'menu',
          resourceId: menuId,
          beforeData: JSON.stringify(menu),
          description: `刪除菜單: ${menu.name}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        message: '菜單刪除成功'
      });
    } catch (error) {
      console.error('刪除菜單失敗:', error);
      return errorResponse('刪除菜單失敗', 500);
    }
  });
}