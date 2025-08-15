import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { withApiAuth } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';

// GET /api/admin/permissions/buttons - 獲取按鈕權限列表
export async function GET(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '10');
      const search = searchParams.get('search') || '';
      const category = searchParams.get('category');
      const roleId = searchParams.get('roleId');
      const includePermissions = searchParams.get('includePermissions') === 'true';

      const skip = (page - 1) * pageSize;

      // 構建查詢條件
      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { identifier: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // 獲取按鈕權限列表和總數
      const [buttonPermissions, total] = await Promise.all([
        prisma.buttonPermission.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: [{ menuId: 'asc' }, { name: 'asc' }],
          include: {
            ...(includePermissions && {
              rolePermissions: roleId ? {
                where: { roleId: parseInt(roleId) }
              } : true
            })
          }
        }),
        prisma.buttonPermission.count({ where })
      ]);

      const totalPages = Math.ceil(Number(total) / pageSize);

      return successResponse({
        data: buttonPermissions,
        pagination: {
          total: Number(total),
          page,
          pageSize,
          totalPages
        }
      });
    } catch (error) {
      console.error('獲取按鈕權限列表失敗:', error);
      return errorResponse('獲取按鈕權限列表失敗', 500);
    }
  });
}

// POST /api/admin/permissions/buttons - 創建新按鈕權限
export async function POST(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { 
        name, 
        identifier, 
        menuId, 
        isActive = true, 
        description 
      } = body;

      // 驗證必填字段
      if (!name || !identifier || !menuId) {
        return errorResponse('按鈕名稱、標識符和菜單ID為必填項', 400);
      }

      // 檢查按鈕權限標識符是否已存在
      const existingButton = await prisma.buttonPermission.findFirst({
        where: { 
          identifier,
          menuId 
        }
      });

      if (existingButton) {
        return errorResponse('按鈕權限標識符已存在', 400);
      }

      // 創建新按鈕權限
      const newButtonPermission = await prisma.buttonPermission.create({
        data: {
          name,
          identifier,
          menuId,
          isActive,
          description
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          resourceType: 'button_permission',
          resourceId: newButtonPermission.id,
          afterData: JSON.stringify(newButtonPermission),
          description: `創建按鈕權限: ${name}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: newButtonPermission,
        message: '按鈕權限創建成功'
      });
    } catch (error) {
      console.error('創建按鈕權限失敗:', error);
      return errorResponse('創建按鈕權限失敗', 500);
    }
  });
}

// PUT /api/admin/permissions/buttons - 批量更新按鈕權限配置
export async function PUT(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { roleId, buttonPermissions } = body;

      if (!roleId || !Array.isArray(buttonPermissions)) {
        return errorResponse('角色ID和按鈕權限配置為必填項', 400);
      }

      // 檢查角色是否存在
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        return errorResponse('角色不存在', 400);
      }

      // 獲取原有權限配置
      const originalPermissions = await prisma.roleButtonPermission.findMany({
        where: { roleId }
      });

      // 開始事務操作
      await prisma.$transaction(async (tx) => {
        // 刪除原有權限
        await tx.roleButtonPermission.deleteMany({
          where: { roleId }
        });

        // 創建新權限
        if (buttonPermissions.length > 0) {
          await tx.roleButtonPermission.createMany({
            data: buttonPermissions.map((permission: any) => ({
              roleId,
              buttonId: permission.buttonId,
              canOperate: permission.canOperate || false
            }))
          });
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          resourceType: 'button_permission',
          resourceId: roleId,
          beforeData: JSON.stringify(originalPermissions),
          afterData: JSON.stringify(buttonPermissions),
          description: `更新角色 ${role.displayName} 的按鈕權限`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        message: '按鈕權限更新成功'
      });
    } catch (error) {
      console.error('更新按鈕權限失敗:', error);
      return errorResponse('更新按鈕權限失敗', 500);
    }
  });
}

// DELETE /api/admin/permissions/buttons - 批量刪除按鈕權限
export async function DELETE(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const buttonIdsParam = searchParams.get('ids');
      
      if (!buttonIdsParam) {
        return errorResponse('請提供要刪除的按鈕權限ID', 400);
      }

      const buttonIds = buttonIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      
      if (buttonIds.length === 0) {
        return errorResponse('無效的按鈕權限ID', 400);
      }

      // 獲取要刪除的按鈕權限信息
      const buttonsToDelete = await prisma.buttonPermission.findMany({
        where: { id: { in: buttonIds } }
      });

      // 刪除按鈕權限（級聯刪除相關權限）
      const deletedButtons = await prisma.buttonPermission.deleteMany({
        where: {
          id: { in: buttonIds }
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'BATCH_DELETE',
          resourceType: 'button_permission',
          resourceId: 0, // 批量操作使用0
          beforeData: JSON.stringify(buttonsToDelete),
          description: `批量刪除按鈕權限: ${buttonsToDelete.map(b => b.name).join(', ')}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: { count: deletedButtons.count },
        message: `成功刪除 ${deletedButtons.count} 個按鈕權限`
      });
    } catch (error) {
      console.error('批量刪除按鈕權限失敗:', error);
      return errorResponse('批量刪除按鈕權限失敗', 500);
    }
  });
}