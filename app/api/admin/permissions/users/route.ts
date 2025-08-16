import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { withApiAuth } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';

// GET /api/admin/permissions/users - 獲取用戶列表及其權限信息
export async function GET(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '10');
      const search = searchParams.get('search') || '';
      const role = searchParams.get('role');
      const isActive = searchParams.get('isActive');

      const skip = (page - 1) * pageSize;

      // 構建查詢條件
      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (role) {
        where.role = role;
      }
      if (isActive !== null && isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      // 獲取用戶列表和總數
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            phone: true,
            department: true,
            position: true,
            avatar: true,
            role: true,
            isActive: true,
            projectIds: true,
            employeeNo: true,
            remark: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true
          }
        }),
        prisma.user.count({ where })
      ]);

      // 为销售人员添加统计数据
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          if (['SALES_MANAGER', 'SALES_PERSON'].includes(user.role) && user.employeeNo) {
            try {
              // 获取销售统计数据
              const salesStats = await prisma.salesControl.aggregate({
                where: {
                  salesId: user.employeeNo,
                  salesStatus: {
                    in: ['SOLD', 'DEPOSIT']
                  }
                },
                _count: {
                  id: true
                },
                _sum: {
                  totalWithParking: true
                }
              });

              // 获取本月销售数据
              const currentMonth = new Date();
              currentMonth.setDate(1);
              currentMonth.setHours(0, 0, 0, 0);

              const monthlyStats = await prisma.salesControl.aggregate({
                where: {
                  salesId: user.employeeNo,
                  salesStatus: {
                    in: ['SOLD', 'DEPOSIT']
                  },
                  updatedAt: {
                    gte: currentMonth
                  }
                },
                _count: {
                  id: true
                },
                _sum: {
                  totalWithParking: true
                }
              });

              return {
                ...user,
                salesStats: {
                  totalSales: salesStats._count.id || 0,
                  totalAmount: salesStats._sum.totalWithParking || 0,
                  currentMonthSales: monthlyStats._count.id || 0,
                  currentMonthAmount: monthlyStats._sum.totalWithParking || 0
                }
              };
            } catch (error) {
              console.error(`获取用户 ${user.id} 销售统计失败:`, error);
              return user;
            }
          }
          return user;
        })
      );

      const totalPages = Math.ceil(Number(total) / pageSize);

      return successResponse({
        data: usersWithStats,
        pagination: {
          total: Number(total),
          page,
          pageSize,
          totalPages
        }
      });
    } catch (error) {
      console.error('獲取用戶列表失敗:', error);
      return errorResponse('獲取用戶列表失敗', 500);
    }
  });
}

// PUT /api/admin/permissions/users - 批量更新用戶角色
export async function PUT(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { userIds, role, isActive, projectIds } = body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return errorResponse('請選擇要更新的用戶', 400);
      }

      // 檢查角色是否有效
      if (role && !Object.values(UserRole).includes(role)) {
        return errorResponse('無效的用戶角色', 400);
      }

      // 獲取要更新的用戶信息（用於審計日誌）
      const usersToUpdate = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          projectIds: true
        }
      });

      // 構建更新數據
      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (projectIds !== undefined) updateData.projectIds = projectIds;

      // 批量更新用戶
      const updatedUsers = await prisma.user.updateMany({
        where: {
          id: { in: userIds }
        },
        data: updateData
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'BATCH_UPDATE',
          resourceType: 'user',
          resourceId: 0, // 批量操作使用0
          beforeData: JSON.stringify(usersToUpdate),
          afterData: JSON.stringify({ userIds, ...updateData }),
          description: `批量更新用戶權限: ${usersToUpdate.map(u => u.name || u.email).join(', ')}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: { count: updatedUsers.count },
        message: `成功更新 ${updatedUsers.count} 個用戶`
      });
    } catch (error) {
      console.error('批量更新用戶失敗:', error);
      return errorResponse('批量更新用戶失敗', 500);
    }
  });
}