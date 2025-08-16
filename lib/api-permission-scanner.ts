import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface APIPermission {
  identifier: string
  name: string
  description: string
  method: string
  path: string
  menuPath?: string
}

export interface APIRouteInfo {
  filePath: string
  relativePath: string
  methods: string[]
  routePath: string
  menuPath?: string
}

/**
 * 扫描API路由文件，生成权限标识
 */
export class APIPermissionScanner {
  private apiDir: string
  private permissions: APIPermission[] = []

  constructor(apiDir: string = 'app/api') {
    this.apiDir = path.resolve(process.cwd(), apiDir)
  }

  /**
   * 扫描所有API路由文件
   */
  async scanRoutes(): Promise<APIRouteInfo[]> {
    const routes: APIRouteInfo[] = []
    await this.walkDirectory(this.apiDir, routes)
    return routes
  }

  /**
   * 递归遍历目录
   */
  private async walkDirectory(dir: string, routes: APIRouteInfo[]): Promise<void> {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        await this.walkDirectory(fullPath, routes)
      } else if (item === 'route.ts' || item === 'route.js') {
        const routeInfo = await this.analyzeRouteFile(fullPath)
        if (routeInfo) {
          routes.push(routeInfo)
        }
      }
    }
  }

  /**
   * 分析路由文件，提取HTTP方法
   */
  private async analyzeRouteFile(filePath: string): Promise<APIRouteInfo | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const methods = this.extractHTTPMethods(content)
      
      if (methods.length === 0) return null

      const relativePath = path.relative(this.apiDir, filePath)
      const routePath = this.convertToRoutePath(relativePath)
      const menuPath = this.inferMenuPath(routePath)

      return {
        filePath,
        relativePath,
        methods,
        routePath,
        menuPath
      }
    } catch (error) {
      console.error(`Error analyzing route file ${filePath}:`, error)
      return null
    }
  }

  /**
   * 从文件内容中提取HTTP方法
   */
  private extractHTTPMethods(content: string): string[] {
    const methods: string[] = []
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    
    for (const method of httpMethods) {
      // 匹配导出的HTTP方法函数
      const regex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}`, 'i')
      if (regex.test(content)) {
        methods.push(method)
      }
    }
    
    return methods
  }

  /**
   * 将文件路径转换为API路由路径
   */
  private convertToRoutePath(relativePath: string): string {
    // 移除 route.ts 或 route.js
    let routePath = relativePath.replace(/\/route\.(ts|js)$/, '')
    
    // 处理动态路由 [param] -> :param
    routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1')
    
    // 处理 catch-all 路由 [...param] -> *param
    routePath = routePath.replace(/\[\.\.\.([^\]]+)\]/g, '*$1')
    
    // 确保以 / 开头
    if (!routePath.startsWith('/')) {
      routePath = '/' + routePath
    }
    
    return routePath
  }

  /**
   * 推断菜单路径
   */
  private inferMenuPath(routePath: string): string | undefined {
    // 移除 /api 前缀
    let menuPath = routePath.replace(/^\/api/, '')
    
    // 移除动态参数部分
    menuPath = menuPath.replace(/\/:[^\/]+/g, '')
    menuPath = menuPath.replace(/\/\*[^\/]+/g, '')
    
    // 如果是根路径或空，返回 undefined
    if (!menuPath || menuPath === '/') {
      return undefined
    }
    
    return menuPath
  }

  /**
   * 生成权限标识
   */
  async generatePermissions(routes: APIRouteInfo[]): Promise<APIPermission[]> {
    const permissions: APIPermission[] = []
    
    for (const route of routes) {
      for (const method of route.methods) {
        const permission = this.createPermission(route, method)
        permissions.push(permission)
      }
    }
    
    return permissions
  }

  /**
   * 创建单个权限对象
   */
  private createPermission(route: APIRouteInfo, method: string): APIPermission {
    const identifier = this.generateIdentifier(route.routePath, method)
    const name = this.generatePermissionName(route.routePath, method)
    const description = this.generatePermissionDescription(route.routePath, method)

    return {
      identifier,
      name,
      description,
      method,
      path: route.routePath,
      menuPath: route.menuPath
    }
  }

  /**
   * 生成权限标识符
   */
  private generateIdentifier(routePath: string, method: string): string {
    // 将路径转换为标识符格式
    let identifier = routePath
      .replace(/^\/api/, '') // 移除 /api 前缀
      .replace(/\/:/g, '_') // 动态参数 /:id -> _id
      .replace(/\/\*/g, '_') // catch-all /*path -> _path
      .replace(/\//g, '_') // 路径分隔符 / -> _
      .replace(/^_/, '') // 移除开头的下划线
      .replace(/_+/g, '_') // 多个下划线合并为一个

    return `${method.toLowerCase()}_${identifier}`.toLowerCase()
  }

  /**
   * 生成权限名称
   */
  private generatePermissionName(routePath: string, method: string): string {
    const actionMap: { [key: string]: string } = {
      'GET': '查看',
      'POST': '创建',
      'PUT': '更新',
      'DELETE': '删除',
      'PATCH': '修改'
    }

    const pathSegments = routePath.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1] || 'resource'
    
    // 移除 api 前缀
    const cleanSegments = pathSegments.filter(seg => seg !== 'api')
    const resourceName = this.translatePathToChineseName(cleanSegments)
    
    return `${actionMap[method] || method}${resourceName}`
  }

  /**
   * 生成权限描述
   */
  private generatePermissionDescription(routePath: string, method: string): string {
    const actionMap: { [key: string]: string } = {
      'GET': '查看和获取',
      'POST': '创建新的',
      'PUT': '完整更新',
      'DELETE': '删除',
      'PATCH': '部分更新'
    }

    const pathSegments = routePath.split('/').filter(Boolean)
    const cleanSegments = pathSegments.filter(seg => seg !== 'api')
    const resourceName = this.translatePathToChineseName(cleanSegments)
    
    return `${actionMap[method] || method}${resourceName}的权限`
  }

  /**
   * 将路径转换为中文名称
   */
  private translatePathToChineseName(pathSegments: string[]): string {
    const translations: { [key: string]: string } = {
      // 管理相关
      'admin': '管理',
      'permissions': '权限',
      'menus': '菜单',
      'buttons': '按钮',
      'users': '用户',
      'roles': '角色',
      'audit-logs': '审计日志',
      
      // 项目相关
      'projects': '项目',
      'sales-control': '销控管理',
      'parking': '停车位',
      'appointments': '客户预约',
      'purchased-customers': '已购客户',
      'sales-personnel': '销售人员',
      'statistics': '统计数据',
      'budget': '预算管理',
      'expenses': '费用管理',
      'commission': '佣金管理',
      'deposit': '订金管理',
      'handover': '交房管理',
      'withdrawal-records': '退户记录',
      'visitor-questionnaire': '访客问卷',
      
      // 通用
      'stats': '统计',
      'batch': '批量操作',
      'test': '测试',
      'init-db': '数据库初始化'
    }

    const translatedSegments = pathSegments.map(segment => {
      // 处理动态参数
      if (segment.startsWith(':')) {
        return `${translations[segment.slice(1)] || '项目'}详情`
      }
      
      return translations[segment] || segment
    })

    return translatedSegments.join('')
  }

  /**
   * 将权限保存到数据库
   */
  async savePermissionsToDatabase(permissions: APIPermission[]): Promise<void> {
    console.log(`正在保存 ${permissions.length} 个API权限到数据库...`)

    for (const permission of permissions) {
      try {
        // 尝试找到对应的菜单
        let menuId: number | undefined

        if (permission.menuPath) {
          // 根据路径查找菜单
          const menu = await prisma.menu.findFirst({
            where: {
              OR: [
                { path: permission.menuPath },
                { path: { contains: permission.menuPath } },
                { name: { contains: permission.menuPath.replace(/\//g, '-') } }
              ]
            }
          })
          
          if (menu) {
            menuId = menu.id
          }
        }

        // 如果没有找到特定菜单，尝试找到根菜单或创建一个通用菜单
        if (!menuId) {
          const generalMenu = await prisma.menu.findFirst({
            where: { name: 'api-permissions' }
          })

          if (!generalMenu) {
            const newMenu = await prisma.menu.create({
              data: {
                name: 'api-permissions',
                displayName: 'API权限',
                path: '/api-permissions',
                icon: 'ApiOutlined',
                sortOrder: 999,
                isActive: true
              }
            })
            menuId = newMenu.id
          } else {
            menuId = generalMenu.id
          }
        }

        // 检查权限是否已存在
        const existingPermission = await prisma.buttonPermission.findFirst({
          where: {
            identifier: permission.identifier,
            menuId: menuId
          }
        })

        if (!existingPermission) {
          await prisma.buttonPermission.create({
            data: {
              name: permission.name,
              identifier: permission.identifier,
              description: permission.description,
              menuId: menuId!,
              isActive: true
            }
          })
          console.log(`✓ 已创建权限: ${permission.name} (${permission.identifier})`)
        } else {
          // 更新现有权限
          await prisma.buttonPermission.update({
            where: { id: existingPermission.id },
            data: {
              name: permission.name,
              description: permission.description,
              isActive: true
            }
          })
          console.log(`✓ 已更新权限: ${permission.name} (${permission.identifier})`)
        }
      } catch (error) {
        console.error(`Error saving permission ${permission.identifier}:`, error)
      }
    }

    console.log('API权限保存完成!')
  }

  /**
   * 完整的扫描和保存流程
   */
  async scanAndSave(): Promise<APIPermission[]> {
    console.log('开始扫描API路由...')
    const routes = await this.scanRoutes()
    console.log(`发现 ${routes.length} 个API路由文件`)

    console.log('生成权限标识...')
    const permissions = await this.generatePermissions(routes)
    console.log(`生成 ${permissions.length} 个权限标识`)

    await this.savePermissionsToDatabase(permissions)
    
    return permissions
  }
}

// 导出单例实例
export const apiPermissionScanner = new APIPermissionScanner()
