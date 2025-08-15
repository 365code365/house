import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { withApiAuth } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';

// GET /api/admin/roles - 獲取所有角色列表
export async function GET(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '10');
      const search = searchParams.get('search') || '';
      const isActive = searchParams.get('isActive');

      const skip = (page - 1) * pageSize;

      // 構建查詢條件
      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (isActive !== null && isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      // 獲取角色列表和總數
      const [roles, total] = await Promise.all([
        prisma.role.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                menuPermissions: true,
                buttonPermissions: true
              }
            }
          }
        }),
        prisma.role.count({ where })
      ]);

      const totalPages = Math.ceil(Number(total) / pageSize);

      return successResponse({
        data: roles,
        pagination: {
          total: Number(total),
          page,
          pageSize,
          totalPages
        }
      });
    } catch (error) {
      console.error('獲取角色列表失敗:', error);
      return errorResponse('獲取角色列表失敗', 500);
    }
  });
}

// POST /api/admin/roles - 創建新角色
export async function POST(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { name, displayName, description, isActive = true } = body;

      // 驗證必填字段
      if (!name || !displayName) {
        return errorResponse('角色名稱和顯示名稱為必填項', 400);
      }

      // 檢查角色名稱是否已存在
      const existingRole = await prisma.role.findUnique({
        where: { name }
      });

      if (existingRole) {
        return errorResponse('角色名稱已存在', 400);
      }

      // 創建新角色
      const newRole = await prisma.role.create({
        data: {
          name,
          displayName,
          description,
          isActive
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
          action: 'CREATE',
          resourceType: 'role',
          resourceId: newRole.id,
          afterData: JSON.stringify(newRole),
          description: `創建角色: ${displayName}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: newRole,
        message: '角色創建成功'
      });
    } catch (error) {
      console.error('創建角色失敗:', error);
      return errorResponse('創建角色失敗', 500);
    }
  });
}

// PUT /api/admin/roles - 批量更新角色狀態
export async function PUT(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { roleIds, isActive } = body;

      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return errorResponse('請選擇要更新的角色', 400);
      }

      // 批量更新角色狀態
      const updatedRoles = await prisma.role.updateMany({
        where: {
          id: { in: roleIds }
        },
        data: {
          isActive
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'BATCH_UPDATE',
          resourceType: 'role',
          resourceId: 0, // 批量操作使用0
          afterData: JSON.stringify({ roleIds, isActive }),
          description: `批量${isActive ? '啟用' : '禁用'}角色`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: { count: updatedRoles.count },
        message: `成功更新 ${updatedRoles.count} 個角色`
      });
    } catch (error) {
      console.error('批量更新角色失敗:', error);
      return errorResponse('批量更新角色失敗', 500);
    }
  });
}

// DELETE /api/admin/roles - 批量刪除角色
export async function DELETE(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const roleIdsParam = searchParams.get('ids');
      
      if (!roleIdsParam) {
        return errorResponse('請提供要刪除的角色ID', 400);
      }

      const roleIds = roleIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      
      if (roleIds.length === 0) {
        return errorResponse('無效的角色ID', 400);
      }

      // 檢查是否包含系統預設角色
      const systemRoles = await prisma.role.findMany({
        where: {
          id: { in: roleIds },
          name: { in: ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_PERSON', 'FINANCE', 'CUSTOMER_SERVICE', 'USER'] }
        }
      });

      if (systemRoles.length > 0) {
        return errorResponse('不能刪除系統預設角色', 400);
      }

      // 獲取要刪除的角色信息（用於審計日誌）
      const rolesToDelete = await prisma.role.findMany({
        where: { id: { in: roleIds } }
      });

      // 刪除角色（級聯刪除相關權限）
      const deletedRoles = await prisma.role.deleteMany({
        where: {
          id: { in: roleIds }
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'BATCH_DELETE',
          resourceType: 'role',
          resourceId: 0, // 批量操作使用0
          beforeData: JSON.stringify(rolesToDelete),
          description: `批量刪除角色: ${rolesToDelete.map(r => r.displayName).join(', ')}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: { count: deletedRoles.count },
        message: `成功刪除 ${deletedRoles.count} 個角色`
      });
    } catch (error) {
      console.error('批量刪除角色失敗:', error);
      return errorResponse('批量刪除角色失敗', 500);
    }
  });
}