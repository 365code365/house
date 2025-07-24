'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  BarChartOutlined,
  AppstoreOutlined,
  EyeOutlined,
  CarOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckOutlined,
  FileTextOutlined,
  FallOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  BuildOutlined,
  RiseOutlined,
  DashboardOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { Card, Button, Typography, Row, Col, Spin, Statistic } from 'antd'

const { Title, Paragraph, Text } = Typography
const { Meta } = Card

interface Project {
  id: number
  name: string
  main_image?: string
  createdAt: string
  updatedAt: string
}

interface QuickStats {
  totalUnits: number
  soldUnits: number
  reservedUnits: number
  availableUnits: number
  totalParkingSpaces: number
  soldParkingSpaces: number
  totalCustomers: number
  totalAppointments: number
}

const quickNavItems = [
  {
    title: '數據統計',
    description: '查看建案整體銷售數據與統計報表',
    icon: BarChartOutlined,
    href: '/statistics',
    color: '#1890ff'
  },
  {
    title: '銷控管理',
    description: '管理房屋銷售狀況與客戶資訊',
    icon: AppstoreOutlined,
    href: '/sales-control',
    color: '#52c41a'
  },
  {
    title: '銷售概況',
    description: '快速查看銷售進度與概況',
    icon: EyeOutlined,
    href: '/sales-overview',
    color: '#722ed1'
  },
  {
    title: '停車位總表',
    description: '管理停車位銷售與分配',
    icon: CarOutlined,
    href: '/parking',
    color: '#fa8c16'
  },
  {
    title: '客戶預約',
    description: '管理客戶看房預約與排程',
    icon: CalendarOutlined,
    href: '/appointments',
    color: '#f5222d'
  },
  {
    title: '已購客名單',
    description: '查看已購買客戶詳細資訊',
    icon: UserOutlined,
    href: '/customers',
    color: '#2f54eb'
  },
  {
    title: '銷售人員',
    description: '管理銷售團隊與權限設定',
    icon: CheckOutlined,
    href: '/sales-personnel',
    color: '#eb2f96'
  },
  {
    title: '訪客問卷',
    description: '收集與分析訪客意見回饋',
    icon: FileTextOutlined,
    href: '/questionnaire',
    color: '#13c2c2'
  },
  {
    title: '退戶分析表',
    description: '分析退戶原因與趨勢',
    icon: FallOutlined,
    href: '/withdrawal',
    color: '#faad14'
  },
  {
    title: '財務總覽',
    description: '查看財務狀況與預算執行',
    icon: DollarOutlined,
    href: '/financial',
    color: '#389e0d'
  }
]

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      // 獲取建案基本資訊
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      if (projectResponse.ok) {
        const projectData = await projectResponse.json()
        setProject(projectData)
      }

      // 獲取快速統計數據
      const statsResponse = await fetch(`/api/projects/${projectId}/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('獲取建案資料失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const salesRate = stats ? Math.round((stats.soldUnits / stats.totalUnits) * 100) : 0
  const parkingRate = stats ? Math.round((stats.soldParkingSpaces / stats.totalParkingSpaces) * 100) : 0

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="載入中...">
          <BuildOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        </Spin>
      </div>
    )
  }

  return (
    <div style={{ padding: '0' }}>
      {/* 建案標題 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>{project?.name}</Title>
        <Text type="secondary">
          建立時間：{project && project.createdAt ? (() => {
            const date = new Date(project.createdAt)
            return isNaN(date.getTime()) ? '資料異常' : date.toLocaleDateString('zh-TW')
          })() : '未設定'}
        </Text>
      </div>

      {/* 快速統計卡片 */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="總戶數"
                value={stats.totalUnits}
                prefix={<BuildOutlined />}
                suffix={<Text type="secondary" style={{ fontSize: '12px' }}>已售 {stats.soldUnits} 戶</Text>}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="銷售率"
                value={salesRate}
                suffix="%"
                prefix={<RiseOutlined />}
                valueStyle={{ color: salesRate > 50 ? '#3f8600' : '#cf1322' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>{stats.availableUnits} 戶可售</Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="停車位"
                value={stats.totalParkingSpaces}
                prefix={<CarOutlined />}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>已售 {stats.soldParkingSpaces} 位 ({parkingRate}%)</Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="客戶預約"
                value={stats.totalAppointments}
                prefix={<DashboardOutlined />}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>{stats.totalCustomers} 位客戶</Text>
            </Card>
          </Col>
        </Row>
      )}

      {/* 快速導航 */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={3} style={{ marginBottom: '16px' }}>功能導航</Title>
        <Row gutter={[16, 16]}>
          {quickNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Col key={item.href} xs={24} sm={12} lg={8}>
                <Link href={`/project/${projectId}${item.href}`} style={{ textDecoration: 'none' }}>
                  <Card 
                    hoverable
                    style={{ height: '100%' }}
                    styles={{ body: { padding: '20px' } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <div 
                        style={{ 
                          padding: '8px', 
                          borderRadius: '8px', 
                          backgroundColor: item.color, 
                          color: 'white',
                          marginRight: '12px'
                        }}
                      >
                        <Icon style={{ fontSize: '20px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Title level={5} style={{ margin: 0, color: '#1f2937' }}>
                          {item.title}
                        </Title>
                      </div>
                      <ArrowRightOutlined style={{ color: '#9ca3af' }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      {item.description}
                    </Text>
                  </Card>
                </Link>
              </Col>
            )
          })}
        </Row>
      </div>

      {/* 快速操作 */}
      <div>
        <Title level={3} style={{ marginBottom: '16px' }}>快速操作</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Link href={`/project/${projectId}/sales-control`} style={{ textDecoration: 'none' }}>
              <Button 
                size="large"
                style={{ 
                  width: '100%', 
                  height: '80px', 
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '16px'
                }}
              >
                <AppstoreOutlined style={{ fontSize: '20px', marginRight: '12px' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '16px' }}>銷控管理</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>管理房屋銷售狀況</div>
                </div>
              </Button>
            </Link>
          </Col>
          
          <Col xs={24} md={8}>
            <Link href={`/project/${projectId}/appointments`} style={{ textDecoration: 'none' }}>
              <Button 
                size="large"
                style={{ 
                  width: '100%', 
                  height: '80px', 
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '16px'
                }}
              >
                <CalendarOutlined style={{ fontSize: '20px', marginRight: '12px' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '16px' }}>新增預約</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>安排客戶看房時間</div>
                </div>
              </Button>
            </Link>
          </Col>
          
          <Col xs={24} md={8}>
            <Link href={`/project/${projectId}/statistics`} style={{ textDecoration: 'none' }}>
              <Button 
                size="large"
                style={{ 
                  width: '100%', 
                  height: '80px', 
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '16px'
                }}
              >
                <BarChartOutlined style={{ fontSize: '20px', marginRight: '12px' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '16px' }}>查看報表</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>生成統計報表</div>
                </div>
              </Button>
            </Link>
          </Col>
        </Row>
      </div>
    </div>
  )
}