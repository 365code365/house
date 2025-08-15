import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/admin/permissions/menus/route'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    menu: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    roleMenuPermission: {
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

describe('Menu Permissions API', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/menus')
  })

  describe('GET /api/admin/permissions/menus', () => {
    it('should return menu tree structure', async () => {
      const mockMenus = [
        {
          id: 1,
          name: 'Dashboard',
          path: '/dashboard',
          icon: 'dashboard',
          parentId: null,
          sortOrder: 1,
          children: [
            {
              id: 2,
              name: 'Overview',
              path: '/dashboard/overview',
              icon: 'overview',
              parentId: 1,
              sortOrder: 1,
            },
          ],
        },
      ]

      ;(prisma.menu.findMany as jest.Mock).mockResolvedValue(mockMenus)

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockMenus)
    })

    it('should return flat menu list when flat=true', async () => {
      const flatRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/menus?flat=true'
      )

      const mockFlatMenus = [
        { id: 1, name: 'Menu1', parentId: null },
        { id: 2, name: 'Menu2', parentId: 1 },
      ]

      ;(prisma.menu.findMany as jest.Mock).mockResolvedValue(mockFlatMenus)

      const response = await GET(flatRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockFlatMenus)
    })

    it('should include role permissions when requested', async () => {
      const permissionRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/menus?includePermissions=true&roleId=1'
      )

      const mockMenusWithPermissions = [
        {
          id: 1,
          name: 'Menu1',
          rolePermissions: [
            {
              roleId: 1,
              menuId: 1,
              canView: true,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            },
          ],
        },
      ]

      ;(prisma.menu.findMany as jest.Mock).mockResolvedValue(mockMenusWithPermissions)

      const response = await GET(permissionRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data[0].rolePermissions).toBeDefined()
    })
  })

  describe('POST /api/admin/permissions/menus', () => {
    it('should create a new menu', async () => {
      const newMenu = {
        name: 'Test Menu',
        path: '/test',
        icon: 'test-icon',
        parentId: null,
        sortOrder: 1,
        isVisible: true,
        description: 'Test menu description',
      }

      const mockCreatedMenu = {
        id: 3,
        ...newMenu,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/menus', {
        method: 'POST',
        body: JSON.stringify(newMenu),
      })

      ;(prisma.menu.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.menu.create as jest.Mock).mockResolvedValue(mockCreatedMenu)
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCreatedMenu)
      expect(data.message).toBe('菜單創建成功')
    })

    it('should return error for duplicate menu name', async () => {
      const newMenu = {
        name: 'Existing Menu',
        path: '/existing',
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/menus', {
        method: 'POST',
        body: JSON.stringify(newMenu),
      })

      ;(prisma.menu.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Existing Menu',
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('菜單名稱已存在')
    })

    it('should return error for missing required fields', async () => {
      const invalidMenu = {
        description: 'Missing required fields',
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/menus', {
        method: 'POST',
        body: JSON.stringify(invalidMenu),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('菜單名稱和路徑為必填項')
    })

    it('should validate parent menu exists', async () => {
      const newMenu = {
        name: 'Child Menu',
        path: '/child',
        parentId: 999, // Non-existent parent
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/menus', {
        method: 'POST',
        body: JSON.stringify(newMenu),
      })

      ;(prisma.menu.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.menu.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('父菜單不存在')
    })
  })

  describe('PUT /api/admin/permissions/menus', () => {
    it('should update menu permissions for a role', async () => {
      const updateData = {
        roleId: 1,
        menuPermissions: [
          {
            menuId: 1,
            canView: true,
            canCreate: true,
            canUpdate: false,
            canDelete: false,
          },
          {
            menuId: 2,
            canView: true,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
          },
        ],
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/menus', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const mockRole = { id: 1, name: 'ADMIN' }
      const mockOriginalPermissions = [
        { roleId: 1, menuId: 1, canView: true },
      ]

      ;(prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole)
      ;(prisma.roleMenuPermission.findMany as jest.Mock).mockResolvedValue(mockOriginalPermissions)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        await callback(prisma)
      })
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('菜單權限更新成功')
    })

    it('should return error for missing roleId', async () => {
      const invalidData = {
        menuPermissions: [],
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/menus', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      })

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('角色ID和菜單權限配置為必填項')
    })

    it('should return error for non-existent role', async () => {
      const updateData = {
        roleId: 999,
        menuPermissions: [],
      }

      mockRequest = new NextRequest('http://localhost:3000/api/admin/permissions/menus', {
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

  describe('DELETE /api/admin/permissions/menus', () => {
    it('should batch delete menus', async () => {
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/menus?ids=1,2,3'
      )

      const mockMenusToDelete = [
        { id: 1, name: 'Menu1' },
        { id: 2, name: 'Menu2' },
        { id: 3, name: 'Menu3' },
      ]

      ;(prisma.menu.findMany as jest.Mock)
        .mockResolvedValueOnce([]) // No child menus
        .mockResolvedValueOnce(mockMenusToDelete)
      ;(prisma.menu.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })
      ;(prisma.permissionAuditLog.create as jest.Mock).mockResolvedValue({})

      const response = await DELETE(deleteRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(3)
      expect(data.message).toBe('成功刪除 3 個菜單')
    })

    it('should return error for menus with children', async () => {
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/menus?ids=1'
      )

      const mockChildMenus = [
        { id: 2, name: 'Child Menu', parentId: 1 },
      ]

      ;(prisma.menu.findMany as jest.Mock).mockResolvedValue(mockChildMenus)

      const response = await DELETE(deleteRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('請先刪除子菜單')
    })

    it('should return error for invalid menu IDs', async () => {
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/menus?ids=invalid'
      )

      const response = await DELETE(deleteRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('無效的菜單ID')
    })

    it('should return error for missing menu IDs', async () => {
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/admin/permissions/menus'
      )

      const response = await DELETE(deleteRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('請提供要刪除的菜單ID')
    })
  })
})
