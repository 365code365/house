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

// GET /api/admin/permissions/buttons/[id] - 獲取單個按鈕權限詳情
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const buttonId = parseInt(params.id);
      
      if (isNaN(buttonId)) {
        return errorResponse('無效的按鈕權限ID', 400);
      }

      const buttonPermission = await prisma.buttonPermission.findUnique({
        where: { id: buttonId },
        include: {
          rolePermissions: {
            include: {
              role: true
            }
          }
        }
      });

      if (!buttonPermission) {
        return errorResponse('按鈕權限不存在', 404);
      }

      return successResponse({
        data: buttonPermission
      });
    } catch (error) {
      console.error('獲取按鈕權限詳情失敗:', error);
      return errorResponse('獲取按鈕權限詳情失敗', 500);
    }
  });
}

// PUT /api/admin/permissions/buttons/[id] - 更新按鈕權限信息
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const buttonId = parseInt(params.id);
      
      if (isNaN(buttonId)) {
        return errorResponse('無效的按鈕權限ID', 400);
      }

      const body = await request.json();
      const { 
        name, 
        displayName, 
        category, 
        sortOrder, 
        isActive, 
        description 
      } = body;

      // 驗證必填字段
      if (!displayName || !category) {
        return errorResponse('顯示名稱和分類為必填項', 400);
      }

      // 獲取原始按鈕權限信息
      const originalButton = await prisma.buttonPermission.findUnique({
        where: { id: buttonId }
      });

      if (!originalButton) {
        return errorResponse('按鈕權限不存在', 404);
      }

      // 如果要修改標識符，檢查新標識符是否已存在
      if (name && name !== originalButton.identifier) {
        const existingButton = await prisma.buttonPermission.findFirst({
          where: { 
            identifier: name,
            menuId: originalButton.menuId
          }
        });

        if (existingButton) {
          return errorResponse('按鈕權限標識符已存在', 400);
        }
      }

      // 更新按鈕權限
      const updatedButton = await prisma.buttonPermission.update({
        where: { id: buttonId },
        data: {
          ...(name && { identifier: name }),
          name: displayName,
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive })
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          resourceType: 'button_permission',
          resourceId: buttonId,
          beforeData: JSON.stringify(originalButton),
          afterData: JSON.stringify(updatedButton),
          description: `更新按鈕權限: ${updatedButton.name}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: updatedButton,
        message: '按鈕權限更新成功'
      });
    } catch (error) {
      console.error('更新按鈕權限失敗:', error);
      return errorResponse('更新按鈕權限失敗', 500);
    }
  });
}

// DELETE /api/admin/permissions/buttons/[id] - 刪除按鈕權限
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const buttonId = parseInt(params.id);
      
      if (isNaN(buttonId)) {
        return errorResponse('無效的按鈕權限ID', 400);
      }

      // 獲取按鈕權限信息
      const buttonPermission = await prisma.buttonPermission.findUnique({
        where: { id: buttonId }
      });

      if (!buttonPermission) {
        return errorResponse('按鈕權限不存在', 404);
      }

      // 刪除相關的角色按鈕權限
      await prisma.roleButtonPermission.deleteMany({
        where: { buttonId: buttonId }
      });

      // 刪除按鈕權限
      await prisma.buttonPermission.delete({
        where: { id: buttonId }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          resourceType: 'button_permission',
          resourceId: buttonId,
          beforeData: JSON.stringify(buttonPermission),
          description: `刪除按鈕權限: ${buttonPermission.name}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        message: '按鈕權限刪除成功'
      });
    } catch (error) {
      console.error('刪除按鈕權限失敗:', error);
      return errorResponse('刪除按鈕權限失敗', 500);
    }
  });
}