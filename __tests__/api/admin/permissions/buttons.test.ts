import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/admin/permissions/buttons/route'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    buttonPermission: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    roleButtonPermission: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    permissionAuditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
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

describe('Button Permissions API', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/buttons')
  })

  describe('GET /api/admin/permissions/buttons', () => {
    it('should return button permissions list with pagination', async () => {
      const mockButtonPermissions = [
        {
          id: 1,
          name: 'Create User',
          identifier: 'user:create',
          menuId: 1,
          isActive: true,
          description: 'Create new user button',
        },
        {
          id: 2,
          name: 'Edit User',
          identifier: 'user:edit',
          menuId: 1,
          isActive: true,
          description: 'Edit user button',
        },
      ]

      ;(prisma.buttonPermission.findMany as jest.Mock).mockResolvedValue(mockButtonPermissions)
      ;(prisma.buttonPermission.count as jest.Mock).mockResolvedValue(2)

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockButtonPermissions)
      expect(data.pagination.total).toBe(2)
    })

    it('should handle search and filters', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/buttons?search=create&page=1&pageSize=5'
      )

      ;(prisma.buttonPermission.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.buttonPermission.count as jest.Mock).mockResolvedValue(0)

      const response = await GET(searchRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should include role permissions when requested', async () => {
      const permissionRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/buttons?includePermissions=true&roleId=1'
      )

      const mockButtonsWithPermissions = [
        {
          id: 1,
          name: 'Button1',
          rolePermissions: [
            {
              roleId: 1,
              buttonId: 1,
              canOperate: true,
            },
          ],
        },
      ]

      ;(prisma.buttonPermission.findMany as jest.Mock).mockResolvedValue(mockButtonsWithPermissions)
      ;(prisma.buttonPermission.count as jest.Mock).mockResolvedValue(1)

      const response = await GET(permissionRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data[0].rolePermissions).toBeDefined()
    })
  })

  describe('POST /api/admin/permissions/buttons', () => {
    it('should create a new button permission', async () => {
      const newButton = {
        name: 'Test Button',
        identifier: 'test:button',
        menuId: 1,
        isActive: true,
        description: 'Test button description',
      }

      const mockCreatedButton = {
        id: 3,
        ...newButton,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/buttons', {
        method: 'POST',
        body: JSON.stringify(newButton),
      })

      ;(prisma.buttonPermission.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.buttonPermission.create as jest.Mock).mockResolvedValue(mockCreatedButton)
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCreatedButton)
      expect(data.message).toBe('按鈕權限創建成功')
    })

    it('should return error for duplicate button identifier', async () => {
      const newButton = {
        name: 'Existing Button',
        identifier: 'existing:button',
        menuId: 1,
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/buttons', {
        method: 'POST',
        body: JSON.stringify(newButton),
      })

      ;(prisma.buttonPermission.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        identifier: 'existing:button',
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('按鈕權限標識符已存在')
    })

    it('should return error for missing required fields', async () => {
      const invalidButton = {
        description: 'Missing required fields',
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/buttons', {
        method: 'POST',
        body: JSON.stringify(invalidButton),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('按鈕名稱、標識符和菜單ID為必填項')
    })
  })

  describe('PUT /api/admin/permissions/buttons', () => {
    it('should update button permissions for a role', async () => {
      const updateData = {
        roleId: 1,
        buttonPermissions: [
          {
            buttonId: 1,
            canOperate: true,
          },
          {
            buttonId: 2,
            canOperate: false,
          },
        ],
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/buttons', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const mockRole = { id: 1, displayName: 'ADMIN' }
      const mockOriginalPermissions = [
        { roleId: 1, buttonId: 1, canOperate: false },
      ]

      ;(prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole)
      ;(prisma.roleButtonPermission.findMany as jest.Mock).mockResolvedValue(mockOriginalPermissions)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        await callback(prisma)
      })
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('按鈕權限更新成功')
    })

    it('should return error for missing roleId', async () => {
      const invalidData = {
        buttonPermissions: [],
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/buttons', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('角色ID和按鈕權限配置為必填項')
    })

    it('should return error for non-existent role', async () => {
      const updateData = {
        roleId: 999,
        buttonPermissions: [],
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/buttons', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      ;(prisma.role.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('角色不存在')
    })
  })

  describe('DELETE /api/admin/permissions/buttons', () => {
    it('should batch delete button permissions', async () => {
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/buttons?ids=1,2,3'
      )

      const mockButtonsToDelete = [
        { id: 1, name: 'Button1' },
        { id: 2, name: 'Button2' },
        { id: 3, name: 'Button3' },
      ]

      ;(prisma.buttonPermission.findMany as jest.Mock).mockResolvedValue(mockButtonsToDelete)
      ;(prisma.buttonPermission.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await DELETE(deleteRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(3)
      expect(data.message).toBe('成功刪除 3 個按鈕權限')
    })

    it('should return error for invalid button IDs', async () => {
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/buttons?ids=invalid'
      )

      const response = await DELETE(deleteRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('無效的按鈕權限ID')
    })

    it('should return error for missing button IDs', async () => {
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/buttons'
      )

      const response = await DELETE(deleteRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('請提供要刪除的按鈕權限ID')
    })
  })
})
