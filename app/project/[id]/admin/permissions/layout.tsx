'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Layout, Menu, Breadcrumb, Spin, Alert } from 'antd'
import {
  SettingOutlined,
  UserOutlined,
  MenuOutlined,
  KeyOutlined,
  TeamOutlined,
  AuditOutlined,
  DashboardOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Sider, Content } = Layout

interface PermissionsLayoutProps {
  children: React.ReactNode
}

export default function PermissionsLayout({ children }: PermissionsLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const [loading, setLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)

  // 檢查超級管理員權限
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      router.push('/login')
      return
    }

    // 只有超級管理員可以訪問權限管理
    if (session.user.role !== 'SUPER_ADMIN') {
      setHasPermission(false)
      setLoading(false)
      return
    }

    setHasPermission(true)
    setLoading(false)
  }, [session, status, router])

  const menuItems: MenuProps['items'] = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: '權限概覽',
      onClick: () => router.push(`/project/${projectId}/admin/permissions`)
    },
    {
      key: 'roles',
      icon: <TeamOutlined />,
      label: '角色管理',
      onClick: () => router.push(`/project/${projectId}/admin/permissions/roles`)
    },
    {
      key: 'menus',
      icon: <MenuOutlined />,
      label: '菜單權限',
      onClick: () => router.push(`/project/${projectId}/admin/permissions/menus`)
    },
    {
      key: 'buttons',
      icon: <KeyOutlined />,
      label: '按鈕權限',
      onClick: () => router.push(`/project/${projectId}/admin/permissions/buttons`)
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: '用戶權限',
      onClick: () => router.push(`/project/${projectId}/admin/permissions/users`)
    },
    {
      key: 'audit',
      icon: <AuditOutlined />,
      label: '審計日誌',
      onClick: () => router.push(`/project/${projectId}/admin/permissions/audit-logs`)
    }
  ]

  // 獲取當前選中的菜單項
  const getCurrentMenuKey = () => {
    const pathname = window.location.pathname
    if (pathname.includes('/roles')) return 'roles'
    if (pathname.includes('/menus')) return 'menus'
    if (pathname.includes('/buttons')) return 'buttons'
    if (pathname.includes('/users')) return 'users'
    if (pathname.includes('/audit-logs')) return 'audit'
    return 'overview'
  }

  // 獲取面包屑導航
  const getBreadcrumbItems = () => {
    const pathname = window.location.pathname
    const items = [
      { title: '項目管理' },
      { title: '系統管理' },
      { title: '權限管理' }
    ]

    if (pathname.includes('/roles')) {
      items.push({ title: '角色管理' })
    } else if (pathname.includes('/menus')) {
      items.push({ title: '菜單權限' })
    } else if (pathname.includes('/buttons')) {
      items.push({ title: '按鈕權限' })
    } else if (pathname.includes('/users')) {
      items.push({ title: '用戶權限' })
    } else if (pathname.includes('/audit-logs')) {
      items.push({ title: '審計日誌' })
    } else {
      items.push({ title: '權限概覽' })
    }

    return items
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="檢查權限中..." />
      </div>
    )
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert
          message="權限不足"
          description="只有超級管理員可以訪問權限管理功能"
          type="error"
          showIcon
          action={
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => router.push(`/project/${projectId}`)}
            >
              返回項目首頁
            </button>
          }
        />
      </div>
    )
  }

  return (
    <Layout className="min-h-screen">
      <Sider
        width={250}
        className="bg-white shadow-md"
        theme="light"
      >
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <SettingOutlined className="text-blue-500 text-xl" />
            <span className="font-semibold text-gray-800">權限管理</span>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getCurrentMenuKey()]}
          items={menuItems}
          className="border-r-0"
        />
      </Sider>
      
      <Layout>
        <Content className="bg-gray-50">
          <div className="p-6">
            <Breadcrumb
              items={getBreadcrumbItems()}
              className="mb-4"
            />
            <div className="bg-white rounded-lg shadow-sm p-6">
              {children}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}