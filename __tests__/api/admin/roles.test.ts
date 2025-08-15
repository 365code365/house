import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/admin/roles/route'

// Mock Prisma
const mockPrisma = {
  role: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  permissionAuditLog: {
    create: jest.fn(),
  },
}

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

// Mock auth utils
jest.mock('@/lib/auth-utils', () => ({
  withApiAuth: jest.fn((request, roles, handler) => {
    // Mock authenticated user
    const mockUser = {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      role: 'SUPER_ADMIN',
    }
    return handler(mockUser)
  }),
}))

describe('Roles API', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequest = new NextRequest('http://localhost:3000/api/admin/roles')
  })

  describe('GET /api/admin/roles', () => {
    it('should return roles list with pagination', async () => {
      const mockRoles = [
        {
          id: 1,
          name: 'ADMIN',
          displayName: '管理员',
          description: '系统管理员',
          isActive: true,
          createdAt: '2025-08-15T16:53:57.516Z',
          updatedAt: '2025-08-15T16:53:57.516Z',
          _count: {
            menuPermissions: 5,
            buttonPermissions: 10,
          },
        },
      ]

      mockPrisma.role.findMany.mockResolvedValue(mockRoles)
      mockPrisma.role.count.mockResolvedValue(1)

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockRoles)
      expect(data.pagination.total).toBe(1)
    })

    it('should handle search and filters', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/admin/roles?search=admin&isActive=true&page=1&pageSize=5'
      )

      mockPrisma.role.findMany.mockResolvedValue([])
      mockPrisma.role.count.mockResolvedValue(0)

      const response = await GET(searchRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/admin/roles', () => {
    it('should create a new role', async () => {
      const newRole = {
        name: 'TEST_ROLE',
        displayName: '测试角色',
        description: '测试角色描述',
        isActive: true,
      }

      const mockCreatedRole = {
        id: 2,
        ...newRole,
        createdAt: '2025-08-15T16:53:57.516Z',
        updatedAt: '2025-08-15T16:53:57.516Z',
        _count: {
          menuPermissions: 0,
          buttonPermissions: 0,
        },
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify(newRole),
      })

      mockPrisma.role.findUnique.mockResolvedValue(null)
      mockPrisma.role.create.mockResolvedValue(mockCreatedRole)
      mockPrisma.permissionAuditLog.create.mockResolvedValue({})

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCreatedRole)
      expect(data.message).toBe('角色創建成功')
    })

    it('should return error for duplicate role name', async () => {
      const newRole = {
        name: 'EXISTING_ROLE',
        displayName: '已存在角色',
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify(newRole),
      })

      mockPrisma.role.findUnique.mockResolvedValue({
        id: 1,
        name: 'EXISTING_ROLE',
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('角色名稱已存在')
    })

    it('should return error for missing required fields', async () => {
      const invalidRole = {
        description: '缺少必填字段',
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify(invalidRole),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('角色名稱和顯示名稱為必填項')
    })
  })

  describe('PUT /api/admin/roles', () => {
    it('should batch update role status', async () => {
      const updateData = {
        roleIds: [1, 2, 3],
        isActive: false,
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/roles', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      mockPrisma.role.updateMany.mockResolvedValue({ count: 3 })
      mockPrisma.permissionAuditLog.create.mockResolvedValue({})

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(3)
      expect(data.message).toBe('成功更新 3 個角色')
    })

    it('should return error for invalid roleIds', async () => {
      const invalidData = {
        roleIds: [],
        isActive: true,
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/roles', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('請選擇要更新的角色')
    })
  })

  describe('DELETE /api/admin/roles', () => {
    it('should batch delete roles', async () => {
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/admin/roles?ids=1,2,3'
      )

      const mockRolesToDelete = [
        { id: 1, name: 'ROLE_1', displayName: '角色1' },
        { id: 2, name: 'ROLE_2', displayName: '角色2' },
        { id: 3, name: 'ROLE_3', displayName: '角色3' },
      ]

      mockPrisma.role.findMany
        .mockResolvedValueOnce([]) // No system roles
        .mockResolvedValueOnce(mockRolesToDelete)
      mockPrisma.role.deleteMany.mockResolvedValue({ count: 3 })
      mockPrisma.permissionAuditLog.create.mockResolvedValue({})

      const response = await DELETE(deleteRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(3)
      expect(data.message).toBe('成功刪除 3 個角色')
    })

    it('should return error for invalid role IDs', async () => {
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/admin/roles?ids=invalid'
      )

      const response = await DELETE(deleteRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('無效的角色ID')
    })

    it('should return error for missing role IDs', async () => {
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/admin/roles'
      )

      const response = await DELETE(deleteRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('請提供要刪除的角色ID')
    })

    it('should prevent deletion of system roles', async () => {
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/admin/roles?ids=1'
      )

      const mockSystemRole = [
        { id: 1, name: 'SUPER_ADMIN', displayName: '超级管理员' },
      ]

      mockPrisma.role.findMany.mockResolvedValueOnce(mockSystemRole)

      const response = await DELETE(deleteRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('不能刪除系統預設角色')
    })
  })
})
