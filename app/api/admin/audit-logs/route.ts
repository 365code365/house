import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { withApiAuth } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';

// GET /api/admin/audit-logs - 獲取權限審計日誌
export async function GET(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '20');
      const action = searchParams.get('action');
      const resourceType = searchParams.get('resourceType');
      const userId = searchParams.get('userId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const search = searchParams.get('search') || '';

      const skip = (page - 1) * pageSize;

      // 構建查詢條件
      const where: any = {};
      
      if (action) {
        where.action = action;
      }
      
      if (resourceType) {
        where.resourceType = resourceType;
      }
      
      if (userId) {
        where.userId = parseInt(userId);
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }
      
      if (search) {
        where.OR = [
          { description: { contains: search, mode: 'insensitive' } },
          { ipAddress: { contains: search, mode: 'insensitive' } }
        ];
      }

      // 獲取審計日誌和總數
      const [auditLogs, total] = await Promise.all([
        prisma.permissionAuditLog.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.permissionAuditLog.count({ where })
      ]);

      const totalPages = Math.ceil(Number(total) / pageSize);

      // 獲取統計信息
      const stats = await prisma.permissionAuditLog.groupBy({
        by: ['action'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
          }
        },
        _count: {
          id: true
        }
      });

      const actionStats = stats.reduce((acc, stat) => {
        acc[stat.action] = Number(stat._count.id);
        return acc;
      }, {} as Record<string, number>);

      return successResponse({
        data: auditLogs,
        pagination: {
          total: Number(total),
          page,
          pageSize,
          totalPages
        },
        stats: actionStats
      });
    } catch (error) {
      console.error('獲取審計日誌失敗:', error);
      return errorResponse('獲取審計日誌失敗', 500);
    }
  });
}

// DELETE /api/admin/audit-logs - 清理舊的審計日誌
export async function DELETE(request: NextRequest) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { beforeDate, keepDays } = body;

      let cutoffDate: Date;
      
      if (beforeDate) {
        cutoffDate = new Date(beforeDate);
      } else if (keepDays) {
        cutoffDate = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);
      } else {
        // 默認保留90天的日誌
        cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      }

      // 獲取要刪除的日誌數量
      const deleteCount = await prisma.permissionAuditLog.count({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      if (deleteCount === 0) {
        return successResponse({
          data: { deletedCount: 0 },
          message: '沒有需要清理的審計日誌'
        });
      }

      // 刪除舊的審計日誌
      const result = await prisma.permissionAuditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      // 記錄清理操作的審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'CLEANUP',
          resourceType: 'audit_log',
          resourceId: 0,
          description: `清理審計日誌: 刪除 ${result.count} 條 ${cutoffDate.toISOString()} 之前的記錄`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: { deletedCount: result.count },
        message: `成功清理 ${result.count} 條審計日誌`
      });
    } catch (error) {
      console.error('清理審計日誌失敗:', error);
      return errorResponse('清理審計日誌失敗', 500);
    }
  });
}