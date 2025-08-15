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

// GET /api/admin/roles/[id] - 獲取單個角色詳情
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const roleId = parseInt(params.id);
      
      if (isNaN(roleId)) {
        return errorResponse('無效的角色ID', 400);
      }

      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          menuPermissions: {
            include: {
              menu: true
            }
          },
          buttonPermissions: {
            include: {
              button: true
            }
          },
          _count: {
            select: {
              menuPermissions: true,
              buttonPermissions: true
            }
          }
        }
      });

      if (!role) {
        return errorResponse('角色不存在', 404);
      }

      return successResponse({
        data: role
      });
    } catch (error) {
      console.error('獲取角色詳情失敗:', error);
      return errorResponse('獲取角色詳情失敗', 500);
    }
  });
}

// PUT /api/admin/roles/[id] - 更新角色信息
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const roleId = parseInt(params.id);
      
      if (isNaN(roleId)) {
        return errorResponse('無效的角色ID', 400);
      }

      const body = await request.json();
      const { name, displayName, description, isActive } = body;

      // 驗證必填字段
      if (!displayName) {
        return errorResponse('顯示名稱為必填項', 400);
      }

      // 獲取原始角色信息
      const originalRole = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!originalRole) {
        return errorResponse('角色不存在', 404);
      }

      // 檢查是否為系統預設角色
      const systemRoleNames = ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_PERSON', 'FINANCE', 'CUSTOMER_SERVICE', 'USER'];
      if (systemRoleNames.includes(originalRole.name) && name && name !== originalRole.name) {
        return errorResponse('不能修改系統預設角色的名稱', 400);
      }

      // 如果要修改名稱，檢查新名稱是否已存在
      if (name && name !== originalRole.name) {
        const existingRole = await prisma.role.findUnique({
          where: { name }
        });

        if (existingRole) {
          return errorResponse('角色名稱已存在', 400);
        }
      }

      // 更新角色
      const updatedRole = await prisma.role.update({
        where: { id: roleId },
        data: {
          ...(name && { name }),
          displayName,
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive })
        },
        include: {
          _count: {
            select: {
              menuPermissions: true,
              buttonPermissions: true
            }
          }
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          resourceType: 'role',
          resourceId: roleId,
          beforeData: JSON.stringify(originalRole),
          afterData: JSON.stringify(updatedRole),
          description: `更新角色: ${updatedRole.displayName}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: updatedRole,
        message: '角色更新成功'
      });
    } catch (error) {
      console.error('更新角色失敗:', error);
      return errorResponse('更新角色失敗', 500);
    }
  });
}

// DELETE /api/admin/roles/[id] - 刪除角色
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const roleId = parseInt(params.id);
      
      if (isNaN(roleId)) {
        return errorResponse('無效的角色ID', 400);
      }

      // 獲取角色信息
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        return errorResponse('角色不存在', 404);
      }

      // 檢查是否為系統預設角色
      const systemRoleNames = ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_PERSON', 'FINANCE', 'CUSTOMER_SERVICE', 'USER'];
      if (systemRoleNames.includes(role.name)) {
        return errorResponse('不能刪除系統預設角色', 400);
      }

      // 檢查是否有用戶使用此角色
      const userCount = await prisma.user.count({
        where: { role: role.name as UserRole }
      });

      if (userCount > 0) {
        return errorResponse(`無法刪除角色，還有 ${userCount} 個用戶正在使用此角色`, 400);
      }

      // 刪除角色（級聯刪除相關權限）
      await prisma.role.delete({
        where: { id: roleId }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          resourceType: 'role',
          resourceId: roleId,
          beforeData: JSON.stringify(role),
          description: `刪除角色: ${role.displayName}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        message: '角色刪除成功'
      });
    } catch (error) {
      console.error('刪除角色失敗:', error);
      return errorResponse('刪除角色失敗', 500);
    }
  });
}