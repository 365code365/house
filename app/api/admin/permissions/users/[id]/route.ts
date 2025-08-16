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

// GET /api/admin/permissions/users/[id] - 獲取用戶詳細權限信息
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const userId = parseInt(params.id);
      
      if (isNaN(userId)) {
        return errorResponse('無效的用戶ID', 400);
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
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
      });

      if (!targetUser) {
        return errorResponse('用戶不存在', 404);
      }

      // 獲取用戶可訪問的項目信息
      let projects: any[] = [];
      if (targetUser.projectIds && targetUser.projectIds.length > 0) {
        const projectIdArray = targetUser.projectIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        projects = await prisma.project.findMany({
          where: {
            id: { in: projectIdArray }
          },
          select: {
            id: true,
            name: true
          }
        });
      }

      // 根據用戶角色獲取對應的權限信息
      let rolePermissions = null;
      if (targetUser.role) {
        const role = await prisma.role.findUnique({
          where: { name: targetUser.role },
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
            }
          }
        });
        rolePermissions = role;
      }

      return successResponse({
        data: {
          ...targetUser,
          projects,
          rolePermissions
        }
      });
    } catch (error) {
      console.error('獲取用戶權限詳情失敗:', error);
      return errorResponse('獲取用戶權限詳情失敗', 500);
    }
  });
}

// PUT /api/admin/permissions/users/[id] - 更新用戶角色和權限
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(request, [UserRole.SUPER_ADMIN], async (user) => {
    try {
      const userId = parseInt(params.id);
      
      if (isNaN(userId)) {
        return errorResponse('無效的用戶ID', 400);
      }

      const body = await request.json();
      const { 
        name, 
        email, 
        phone, 
        department, 
        position, 
        role, 
        isActive, 
        projectIds, 
        employeeNo, 
        remark 
      } = body;

      // 獲取原始用戶信息
      const originalUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          projectIds: true
        }
      });

      if (!originalUser) {
        return errorResponse('用戶不存在', 404);
      }

      // 檢查角色是否有效
      if (role && !Object.values(UserRole).includes(role)) {
        return errorResponse('無效的用戶角色', 400);
      }

      // 如果設置了項目權限，檢查項目是否存在
      if (projectIds && Array.isArray(projectIds) && projectIds.length > 0) {
        const validProjects = await prisma.project.findMany({
          where: {
            id: { in: projectIds }
          },
          select: { id: true }
        });

        const existingProjectIds = validProjects.map(p => p.id);
        const invalidProjectIds = projectIds.filter(id => !existingProjectIds.includes(id));
        
        if (invalidProjectIds.length > 0) {
          return errorResponse(`項目不存在或已停用: ${invalidProjectIds.join(', ')}`, 400);
        }
      }

      // 構建更新數據
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (department !== undefined) updateData.department = department;
      if (position !== undefined) updateData.position = position;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (projectIds !== undefined) {
        updateData.projectIds = Array.isArray(projectIds) ? projectIds.join(',') : projectIds;
      }
      if (employeeNo !== undefined) updateData.employeeNo = employeeNo;
      if (remark !== undefined) updateData.remark = remark;

      // 更新用戶
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
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
          updatedAt: true
        }
      });

      // 記錄審計日誌
      await prisma.permissionAuditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          resourceType: 'user',
          resourceId: userId,
          beforeData: JSON.stringify(originalUser),
          afterData: JSON.stringify(updatedUser),
          description: `更新用戶權限: ${originalUser.name || originalUser.email}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          userAgent: request.headers.get('user-agent') || ''
        }
      });

      return successResponse({
        data: updatedUser,
        message: '用戶權限更新成功'
      });
    } catch (error) {
      console.error('更新用戶權限失敗:', error);
      return errorResponse('更新用戶權限失敗', 500);
    }
  });
}