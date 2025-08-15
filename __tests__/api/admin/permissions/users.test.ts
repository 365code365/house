import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/admin/permissions/users/route'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    permissionAuditLog: {
      create: jest.fn(),
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

describe('User Permissions API', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/users')
  })

  describe('GET /api/admin/permissions/users', () => {
    it('should return users list with pagination', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.ADMIN,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          projectIds: '1,2,3',
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: UserRole.SALES_PERSON,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
          projectIds: '1',
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(2)

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockUsers)
      expect(data.pagination.total).toBe(2)
    })

    it('should handle search and filters', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/users?search=john&role=ADMIN&isActive=true&page=1&pageSize=5'
      )

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      const response = await GET(searchRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return empty list when no users found', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.pagination.total).toBe(0)
    })
  })

  describe('PUT /api/admin/permissions/users', () => {
    it('should batch update user roles', async () => {
      const updateData = {
        userIds: [1, 2, 3],
        role: UserRole.SALES_MANAGER,
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/users', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const mockUsersToUpdate = [
        { id: 1, name: 'User1', email: 'user1@test.com', role: UserRole.USER, isActive: true, projectIds: null },
        { id: 2, name: 'User2', email: 'user2@test.com', role: UserRole.USER, isActive: true, projectIds: null },
        { id: 3, name: 'User3', email: 'user3@test.com', role: UserRole.USER, isActive: true, projectIds: null },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsersToUpdate)
      ;(prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 3 })
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(3)
      expect(data.message).toBe('成功更新 3 個用戶')
    })

    it('should batch update user status', async () => {
      const updateData = {
        userIds: [1, 2],
        isActive: false,
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/users', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const mockUsersToUpdate = [
        { id: 1, name: 'User1', email: 'user1@test.com', role: UserRole.USER, isActive: true, projectIds: null },
        { id: 2, name: 'User2', email: 'user2@test.com', role: UserRole.USER, isActive: true, projectIds: null },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsersToUpdate)
      ;(prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(2)
      expect(data.message).toBe('成功更新 2 個用戶')
    })

    it('should batch update user project access', async () => {
      const updateData = {
        userIds: [1],
        projectIds: '1,2,3,4',
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/users', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const mockUsersToUpdate = [
        { id: 1, name: 'User1', email: 'user1@test.com', role: UserRole.USER, isActive: true, projectIds: '1' },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsersToUpdate)
      ;(prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(1)
      expect(data.message).toBe('成功更新 1 個用戶')
    })

    it('should return error for invalid role', async () => {
      const updateData = {
        userIds: [1],
        role: 'INVALID_ROLE',
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/users', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('無效的用戶角色')
    })

    it('should return error for empty userIds', async () => {
      const updateData = {
        userIds: [],
        role: UserRole.ADMIN,
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/users', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('請選擇要更新的用戶')
    })

    it('should return error for missing userIds', async () => {
      const updateData = {
        role: UserRole.ADMIN,
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/users', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('請選擇要更新的用戶')
    })

    it('should handle multiple update fields', async () => {
      const updateData = {
        userIds: [1],
        role: UserRole.SALES_MANAGER,
        isActive: true,
        projectIds: '1,2',
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/users', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const mockUsersToUpdate = [
        { id: 1, name: 'User1', email: 'user1@test.com', role: UserRole.USER, isActive: false, projectIds: '1' },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsersToUpdate)
      ;(prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(1)
    })
  })
})
