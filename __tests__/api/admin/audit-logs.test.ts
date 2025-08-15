import { NextRequest } from 'next/server'
import { GET, DELETE } from '@/app/api/admin/audit-logs/route'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    permissionAuditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}))

// Mock auth utils
jest.mock('@/lib/auth-utils', () => ({
  withApiAuth: jest.fn((request, roles, handler) => {
    // Mock authenticated user
    const mockUser = {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      role: UserRole.SUPER_ADMIN,
    }
    return handler(mockUser)
  }),
}))

describe('Audit Logs API', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequest = new NextRequest('http://localhost:3000/api/admin/audit-logs')
  })

  describe('GET /api/admin/audit-logs', () => {
    it('should return audit logs with pagination', async () => {
      const mockAuditLogs = [
        {
          id: 1,
          userId: 1,
          action: 'CREATE',
          resourceType: 'role',
          resourceId: 1,
          beforeData: null,
          afterData: '{"name":"TEST_ROLE"}',
          description: '创建角色: TEST_ROLE',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 1,
            name: 'Admin User',
            email: 'admin@test.com',
          },
        },
        {
          id: 2,
          userId: 1,
          action: 'UPDATE',
          resourceType: 'user',
          resourceId: 2,
          beforeData: '{"role":"USER"}',
          afterData: '{"role":"ADMIN"}',
          description: '更新用户角色',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 1,
            name: 'Admin User',
            email: 'admin@test.com',
          },
        },
      ]

      const mockStats = [
        { action: 'CREATE', _count: { id: 5 } },
        { action: 'UPDATE', _count: { id: 3 } },
        { action: 'DELETE', _count: { id: 1 } },
      ]

      ;(prisma.permissionAuditLog.findMany as jest.Mock).mockResolvedValue(mockAuditLogs)
      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(2)
      ;(prisma.permissionAuditLog.groupBy as jest.Mock).mockResolvedValue(mockStats)

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockAuditLogs)
      expect(data.pagination.total).toBe(2)
      expect(data.stats).toEqual({
        CREATE: 5,
        UPDATE: 3,
        DELETE: 1,
      })
    })

    it('should handle action filter', async () => {
      const actionRequest = new NextRequest(
        'http://localhost:3000/api/admin/audit-logs?action=CREATE'
      )

      ;(prisma.permissionAuditLog.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.permissionAuditLog.groupBy as jest.Mock).mockResolvedValue([])

      const response = await GET(actionRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle resource type filter', async () => {
      const resourceRequest = new NextRequest(
        'http://localhost:3000/api/admin/audit-logs?resourceType=role'
      )

      ;(prisma.permissionAuditLog.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.permissionAuditLog.groupBy as jest.Mock).mockResolvedValue([])

      const response = await GET(resourceRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle user ID filter', async () => {
      const userRequest = new NextRequest(
        'http://localhost:3000/api/admin/audit-logs?userId=1'
      )

      ;(prisma.permissionAuditLog.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.permissionAuditLog.groupBy as jest.Mock).mockResolvedValue([])

      const response = await GET(userRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle date range filters', async () => {
      const dateRequest = new NextRequest(
        'http://localhost:3000/api/admin/audit-logs?startDate=2024-01-01&endDate=2024-12-31'
      )

      ;(prisma.permissionAuditLog.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.permissionAuditLog.groupBy as jest.Mock).mockResolvedValue([])

      const response = await GET(dateRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle search filter', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/admin/audit-logs?search=role'
      )

      ;(prisma.permissionAuditLog.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.permissionAuditLog.groupBy as jest.Mock).mockResolvedValue([])

      const response = await GET(searchRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle pagination', async () => {
      const paginationRequest = new NextRequest(
        'http://localhost:3000/api/admin/audit-logs?page=2&pageSize=5'
      )

      ;(prisma.permissionAuditLog.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.permissionAuditLog.groupBy as jest.Mock).mockResolvedValue([])

      const response = await GET(paginationRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return empty list when no logs found', async () => {
      ;(prisma.permissionAuditLog.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.permissionAuditLog.groupBy as jest.Mock).mockResolvedValue([])

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.pagination.total).toBe(0)
    })
  })

  describe('DELETE /api/admin/audit-logs', () => {
    it('should cleanup old audit logs with beforeDate', async () => {
      const cleanupData = {
        beforeDate: '2024-01-01T00:00:00.000Z',
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
        method: 'DELETE',
        body: JSON.stringify(cleanupData),
      })

      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(100)
      ;(prisma.permissionAuditLog.deleteMany as jest.Mock).mockResolvedValue({ count: 100 })
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.deletedCount).toBe(100)
      expect(data.message).toBe('成功清理 100 條審計日誌')
    })

    it('should cleanup old audit logs with keepDays', async () => {
      const cleanupData = {
        keepDays: 30,
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
        method: 'DELETE',
        body: JSON.stringify(cleanupData),
      })

      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(50)
      ;(prisma.permissionAuditLog.deleteMany as jest.Mock).mockResolvedValue({ count: 50 })
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.deletedCount).toBe(50)
      expect(data.message).toBe('成功清理 50 條審計日誌')
    })

    it('should use default 90 days when no parameters provided', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
        method: 'DELETE',
        body: JSON.stringify({}),
      })

      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(0)

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.deletedCount).toBe(0)
      expect(data.message).toBe('沒有需要清理的審計日誌')
    })

    it('should handle no logs to cleanup', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
        method: 'DELETE',
        body: JSON.stringify({ keepDays: 30 }),
      })

      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(0)

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.deletedCount).toBe(0)
      expect(data.message).toBe('沒有需要清理的審計日誌')
    })

    it('should create audit log for cleanup operation', async () => {
      const cleanupData = {
        beforeDate: '2024-01-01T00:00:00.000Z',
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
        method: 'DELETE',
        body: JSON.stringify(cleanupData),
      })

      ;(prisma.permissionAuditLog.count as jest.Mock).mockResolvedValue(100)
      ;(prisma.permissionAuditLog.deleteMany as jest.Mock).mockResolvedValue({ count: 100 })
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await DELETE(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Verify that audit log was created for cleanup operation
      expect(prisma.permissionAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CLEANUP',
          resourceType: 'audit_log',
          description: expect.stringContaining('清理審計日誌: 刪除 100 條'),
        }),
      })
    })
  })
})
