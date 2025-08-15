'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  List,
  Avatar,
  Tag,
  Alert,
  Spin,
  Typography,
  Space,
  Progress
} from 'antd'
import {
  TeamOutlined,
  MenuOutlined,
  KeyOutlined,
  UserOutlined,
  PlusOutlined,
  SettingOutlined,
  AuditOutlined,
  SecurityScanOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { message } from 'antd'

const { Title, Text } = Typography

interface PermissionStats {
  totalRoles: number
  totalMenus: number
  totalButtons: number
  totalUsers: number
  activeUsers: number
  recentAudits: number
}

interface RecentActivity {
  id: string
  action: string
  resource: string
  user: string
  timestamp: string
  type: 'success' | 'warning' | 'error'
}

export default function PermissionsOverview() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PermissionStats>({
    totalRoles: 0,
    totalMenus: 0,
    totalButtons: 0,
    totalUsers: 0,
    activeUsers: 0,
    recentAudits: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])

  // 獲取權限統計數據
  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // 並行獲取各種統計數據
      const [rolesRes, menusRes, buttonsRes, usersRes, auditsRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions/menus'),
        fetch('/api/admin/permissions/buttons'),
        fetch('/api/admin/permissions/users'),
        fetch('/api/admin/audit-logs?limit=10')
      ])

      if (!rolesRes.ok || !menusRes.ok || !buttonsRes.ok || !usersRes.ok || !auditsRes.ok) {
        throw new Error('獲取統計數據失敗')
      }

      const [rolesData, menusData, buttonsData, usersData, auditsData] = await Promise.all([
        rolesRes.json(),
        menusRes.json(),
        buttonsRes.json(),
        usersRes.json(),
        auditsRes.json()
      ])

      setStats({
        totalRoles: rolesData.pagination?.total || 0,
        totalMenus: menusData.data?.length || 0,
        totalButtons: buttonsData.pagination?.total || 0,
        totalUsers: usersData.pagination?.total || 0,
        activeUsers: usersData.data?.filter((user: any) => user.isActive).length || 0,
        recentAudits: auditsData.pagination?.total || 0
      })

      // 處理最近活動數據
      const activities: RecentActivity[] = (auditsData.data || []).map((audit: any) => ({
        id: audit.id,
        action: audit.action,
        resource: `${audit.resourceType}: ${audit.resourceName}`,
        user: audit.user?.name || '系統',
        timestamp: new Date(audit.createdAt).toLocaleString('zh-TW'),
        type: audit.action.includes('DELETE') ? 'error' : 
              audit.action.includes('UPDATE') ? 'warning' : 'success'
      }))
      
      setRecentActivities(activities)
    } catch (error) {
      console.error('獲取統計數據失敗:', error)
      message.error('獲取統計數據失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const quickActions = [
    {
      title: '創建新角色',
      description: '添加新的用戶角色並配置權限',
      icon: <TeamOutlined />,
      color: '#1890ff',
      action: () => router.push(`/project/${projectId}/admin/permissions/roles`)
    },
    {
      title: '配置菜單權限',
      description: '管理系統菜單的訪問權限',
      icon: <MenuOutlined />,
      color: '#52c41a',
      action: () => router.push(`/project/${projectId}/admin/permissions/menus`)
    },
    {
      title: '設置按鈕權限',
      description: '控制頁面按鈕的操作權限',
      icon: <KeyOutlined />,
      color: '#faad14',
      action: () => router.push(`/project/${projectId}/admin/permissions/buttons`)
    },
    {
      title: '分配用戶權限',
      description: '為用戶分配角色和權限',
      icon: <UserOutlined />,
      color: '#722ed1',
      action: () => router.push(`/project/${projectId}/admin/permissions/users`)
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" tip="載入權限數據中..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-2">
            <SecurityScanOutlined className="mr-2" />
            權限管理概覽
          </Title>
          <Text type="secondary">
            管理系統角色、菜單權限、按鈕權限和用戶權限分配
          </Text>
        </div>
        <Button
          type="primary"
          icon={<AuditOutlined />}
          onClick={() => router.push(`/project/${projectId}/admin/permissions/audit`)}
        >
          查看審計日誌
        </Button>
      </div>

      {/* 統計卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="總角色數"
              value={stats.totalRoles}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="菜單權限"
              value={stats.totalMenus}
              prefix={<MenuOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="按鈕權限"
              value={stats.totalButtons}
              prefix={<KeyOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活躍用戶"
              value={stats.activeUsers}
              suffix={`/ ${stats.totalUsers}`}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 系統健康狀態 */}
      <Card title="系統權限健康狀態" extra={<CheckCircleOutlined style={{ color: '#52c41a' }} />}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={Math.round((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100)}
                format={percent => `${percent}%`}
                strokeColor="#52c41a"
              />
              <div className="mt-2">
                <Text strong>用戶活躍率</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <Space direction="vertical" className="w-full">
              <Alert
                message="權限配置正常"
                description="所有角色都已正確配置權限，系統運行穩定"
                type="success"
                showIcon
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <Text strong className="text-blue-600">{stats.recentAudits}</Text>
                  <div className="text-sm text-gray-600">最近審計記錄</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <Text strong className="text-green-600">100%</Text>
                  <div className="text-sm text-gray-600">權限覆蓋率</div>
                </div>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 快速操作 */}
        <Col xs={24} lg={12}>
          <Card title="快速操作" extra={<SettingOutlined />}>
            <List
              dataSource={quickActions}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="action"
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={item.action}
                    >
                      執行
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: item.color }}
                        icon={item.icon}
                      />
                    }
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 最近活動 */}
        <Col xs={24} lg={12}>
          <Card
            title="最近權限變更"
            extra={
              <Button
                type="link"
                onClick={() => router.push(`/project/${projectId}/admin/permissions/audit`)}
              >
                查看全部
              </Button>
            }
          >
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={
                          item.type === 'success' ? <CheckCircleOutlined /> :
                          item.type === 'warning' ? <ExclamationCircleOutlined /> :
                          <ExclamationCircleOutlined />
                        }
                        style={{
                          backgroundColor:
                            item.type === 'success' ? '#52c41a' :
                            item.type === 'warning' ? '#faad14' : '#ff4d4f'
                        }}
                      />
                    }
                    title={
                      <div className="flex items-center justify-between">
                        <span>{item.action}</span>
                        <Tag color={item.type === 'success' ? 'green' : item.type === 'warning' ? 'orange' : 'red'}>
                          {item.type === 'success' ? '成功' : item.type === 'warning' ? '修改' : '刪除'}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div>{item.resource}</div>
                        <Text type="secondary" className="text-xs">
                          {item.user} · {item.timestamp}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}