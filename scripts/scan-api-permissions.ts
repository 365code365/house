#!/usr/bin/env tsx

import { apiPermissionScanner } from '../lib/api-permission-scanner'

/**
 * 扫描API权限的独立脚本
 * 可以在项目启动时或部署时运行
 */
async function main() {
  try {
    console.log('🚀 开始扫描API权限...')
    
    const permissions = await apiPermissionScanner.scanAndSave()
    
    console.log('\n✅ API权限扫描完成!')
    console.log(`📊 总计扫描到 ${permissions.length} 个API权限`)
    
    // 按菜单路径分组显示
    const groupedByMenu = permissions.reduce((acc, perm) => {
      const menuPath = perm.menuPath || '未分类'
      if (!acc[menuPath]) {
        acc[menuPath] = []
      }
      acc[menuPath].push(perm)
      return acc
    }, {} as Record<string, typeof permissions>)

    console.log('\n📋 权限分布:')
    Object.entries(groupedByMenu).forEach(([menuPath, perms]) => {
      console.log(`  ${menuPath}: ${perms.length} 个权限`)
    })

    process.exit(0)
  } catch (error) {
    console.error('❌ API权限扫描失败:', error)
    process.exit(1)
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  main()
}
