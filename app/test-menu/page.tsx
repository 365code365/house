'use client'

import { useEffect, useState } from 'react'
import { Card, Typography, Tree, Button, Space } from 'antd'
import type { DataNode } from 'antd/es/tree'

const { Title, Text } = Typography

interface Menu {
  id: number
  name: string
  displayName: string
  path?: string
  icon?: string
  parentId?: number
  sortOrder: number
  isActive: boolean
  children?: Menu[]
  parent?: {
    id: number
    displayName: string
  }
}

export default function TestMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])

  // 構建菜單樹數據
  const buildMenuTree = (menus: Menu[]): DataNode[] => {
    const menuMap = new Map<number, Menu & { children: Menu[] }>()
    const roots: (Menu & { children: Menu[] })[] = []
    
    // 初始化所有菜單
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [] })
    })
    
    // 構建樹結構
    menus.forEach(menu => {
      const menuNode = menuMap.get(menu.id)!
      if (menu.parentId && menuMap.has(menu.parentId)) {
        menuMap.get(menu.parentId)!.children.push(menuNode)
      } else {
        roots.push(menuNode)
      }
    })
    
    // 轉換為Tree組件需要的數據格式
    const convertToTreeData = (nodes: (Menu & { children: Menu[] })[]): DataNode[] => {
      return nodes.map(node => ({
        key: node.id,
        title: (
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {node.children && node.children.length > 0 ? '📁' : '📄'}
            </span>
            <span className="font-medium">{node.displayName}</span>
            <Text type="secondary" className="text-xs">({node.name})</Text>
            <Text type="secondary" className="text-xs text-gray-400">- {node.path}</Text>
          </div>
        ),
        children: node.children && node.children.length > 0 ? convertToTreeData(node.children as (Menu & { children: Menu[] })[]) : undefined
      }))
    }
    
    return convertToTreeData(roots)
  }

  // 獲取菜單列表
  const fetchMenus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/permissions/menus')
      if (!response.ok) throw new Error('獲取菜單列表失敗')
      const data = await response.json()
      console.log('API返回數據:', data)
      setMenus(data.data || [])
      
      // 默認展開所有節點
      const allKeys = (data.data || []).map((menu: Menu) => menu.id)
      setExpandedKeys(allKeys)
    } catch (error) {
      console.error('獲取菜單列表失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenus()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <Title level={2}>菜單測試頁面</Title>
      
      <div className="space-y-4">
        <Space>
          <Button onClick={fetchMenus} loading={loading}>
            重新加載
          </Button>
          <Button onClick={() => setExpandedKeys(menus.map(m => m.id))}>
            全部展開
          </Button>
          <Button onClick={() => setExpandedKeys([])}>
            全部收起
          </Button>
        </Space>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="菜單樹結構" className="h-96">
            <div className="h-80 overflow-auto">
              <Tree
                treeData={buildMenuTree(menus)}
                expandedKeys={expandedKeys}
                onExpand={setExpandedKeys}
                showLine
                showIcon={false}
                className="menu-tree"
              />
            </div>
          </Card>

          <Card title="原始數據" className="h-96">
            <div className="h-80 overflow-auto">
              <pre className="text-xs">
                {JSON.stringify(menus, null, 2)}
              </pre>
            </div>
          </Card>
        </div>

        <Card title="數據統計">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Text type="secondary">總菜單數</Text>
              <div className="text-2xl font-bold text-blue-600">{menus.length}</div>
            </div>
            <div>
              <Text type="secondary">根菜單</Text>
              <div className="text-2xl font-bold text-green-600">
                {menus.filter(m => !m.parentId).length}
              </div>
            </div>
            <div>
              <Text type="secondary">子菜單</Text>
              <div className="text-2xl font-bold text-orange-600">
                {menus.filter(m => m.parentId).length}
              </div>
            </div>
            <div>
              <Text type="secondary">有子菜單的根菜單</Text>
              <div className="text-2xl font-bold text-purple-600">
                {menus.filter(m => !m.parentId && m.children && m.children.length > 0).length}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}


