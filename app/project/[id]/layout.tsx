'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BuildOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  EyeOutlined,
  CarOutlined,
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  FallOutlined,
  DollarOutlined,
  BankOutlined,
  CreditCardOutlined,
  FileOutlined,
  MoneyCollectOutlined,
  DollarCircleOutlined,
  MenuOutlined
} from '@ant-design/icons'
import { Layout, Menu, Button, Spin, Typography, Drawer } from 'antd'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

interface Project {
  id: number
  name: string
  main_image?: string
  created_at: string
  updated_at: string
}

type MenuItem = Required<MenuProps>['items'][number]

const getMenuItems = (projectId: string): MenuItem[] => [
  {
    key: 'statistics',
    icon: <BarChartOutlined />,
    label: <Link href={`/project/${projectId}/statistics`}>數據統計</Link>,
  },
  {
    key: 'sales-control',
    icon: <AppstoreOutlined />,
    label: <Link href={`/project/${projectId}/sales-control`}>銷控管理</Link>,
  },
  {
    key: 'sales-overview',
    icon: <EyeOutlined />,
    label: <Link href={`/project/${projectId}/sales-overview`}>銷售概況</Link>,
  },
  {
    key: 'parking',
    icon: <CarOutlined />,
    label: <Link href={`/project/${projectId}/parking`}>停車位總表</Link>,
  },
  {
    key: 'appointments',
    icon: <CalendarOutlined />,
    label: <Link href={`/project/${projectId}/appointments`}>客戶預約</Link>,
  },
  {
    key: 'customers',
    icon: <TeamOutlined />,
    label: <Link href={`/project/${projectId}/customers`}>已購客名單</Link>,
  },
  {
    key: 'sales-personnel',
    icon: <UserOutlined />,
    label: <Link href={`/project/${projectId}/sales-personnel`}>銷售人員</Link>,
  },
  {
    key: 'questionnaire',
    icon: <FileTextOutlined />,
    label: <Link href={`/project/${projectId}/questionnaire`}>訪客問卷</Link>,
  },
  {
    key: 'withdrawal',
    icon: <FallOutlined />,
    label: <Link href={`/project/${projectId}/withdrawal`}>退戶分析表</Link>,
  },
  {
    key: 'financial',
    icon: <DollarOutlined />,
    label: <Link href={`/project/${projectId}/financial`}>財務總覽</Link>,
  },
  {
    key: 'budget',
    icon: <BankOutlined />,
    label: <Link href={`/project/${projectId}/budget`}>預算規劃</Link>,
  },
  {
    key: 'expenses',
    icon: <CreditCardOutlined />,
    label: <Link href={`/project/${projectId}/expenses`}>支出管理</Link>,
  },
  {
    key: 'commission',
    icon: <MoneyCollectOutlined />,
    label: <Link href={`/project/${projectId}/commission`}>請傭列表</Link>,
  },
  {
    key: 'deposit',
    icon: <DollarCircleOutlined />,
    label: <Link href={`/project/${projectId}/deposit`}>訂金管理</Link>,
  },
  {
    key: 'handover',
    icon: <FileOutlined />,
    label: <Link href={`/project/${projectId}/handover`}>點交屋管理</Link>,
  },
]

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('獲取建案資訊失敗:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="載入中...">
          <div className="text-center p-8">
            <BuildOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </div>
        </Spin>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BuildOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '16px' }} />
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>建案不存在</Text>
          <Button type="primary" onClick={() => router.push('/')}>
            返回首頁
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 桌面端侧边栏 */}
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true)
          }
        }}
        className="hidden lg:block"
      >
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
            <BuildOutlined style={{ fontSize: '24px' }} />
            {!collapsed && <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>銷售系統</span>}
          </Link>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={getMenuItems(projectId)}
          style={{ borderRight: 0 }}
        />
      </Sider>

      {/* 移动端抽屉 */}
      <Drawer
        title={
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            <BuildOutlined style={{ marginRight: '8px' }} />
            銷售管理系統
          </Link>
        }
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0 } }}
        width={256}
        className="lg:hidden"
      >
        <Menu
          mode="inline"
          items={getMenuItems(projectId)}
          onClick={() => setMobileDrawerOpen(false)}
        />
      </Drawer>

      <Layout>
        {/* 顶部导航栏 */}
        <Header style={{ background: '#fff', padding: '0 16px', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileDrawerOpen(true)}
                style={{ marginRight: '16px' }}
                className="lg:hidden"
              />
              <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                <BuildOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
                <Title level={4} style={{ margin: 0, color: '#1f2937' }}>銷售管理系統</Title>
              </Link>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Title level={5} style={{ margin: 0, color: '#1f2937' }}>{project.name}</Title>
              <Text type="secondary">建案管理</Text>
            </div>
          </div>
        </Header>

        {/* 主内容区域 */}
        <Content style={{ margin: '24px 16px', padding: '24px', background: '#fff', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}