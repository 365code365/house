'use client'

import {useState, useEffect} from 'react'
import {useParams, useRouter} from 'next/navigation'
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
    MenuOutlined,
    SearchOutlined
} from '@ant-design/icons'
import {Layout, Menu, Button, Spin, Typography, Drawer, Input, AutoComplete} from 'antd'
import type {MenuProps} from 'antd'

const {Header, Sider, Content} = Layout
const {Title, Text} = Typography

interface Project {
    id: number
    name: string
    main_image?: string
    createdAt: string
    updatedAt: string
}

type MenuItem = Required<MenuProps>['items'][number]

const getMenuItems = (projectId: string): MenuItem[] => [
    {
        key: 'statistics',
        icon: <BarChartOutlined/>,
        label: <Link href={`/project/${projectId}/statistics`}>數據統計</Link>,
    },
    {
        key: 'sales-control-group',
        icon: <AppstoreOutlined/>,
        label: '銷控總表',
        children: [
            {
                key: 'sales-control',
                icon: <AppstoreOutlined/>,
                label: <Link href={`/project/${projectId}/sales-control`}>銷控管理</Link>,
            },
            {
                key: 'sales-overview',
                icon: <EyeOutlined/>,
                label: <Link href={`/project/${projectId}/sales-overview`}>銷售概況</Link>,
            },
            {
                key: 'parking',
                icon: <CarOutlined/>,
                label: <Link href={`/project/${projectId}/parking`}>停車位總表</Link>,
            },
        ],
    },
    {
        key: 'appointments',
        icon: <CalendarOutlined/>,
        label: <Link href={`/project/${projectId}/appointments`}>客戶預約</Link>,
    },
    {
        key: 'customers',
        icon: <TeamOutlined/>,
        label: <Link href={`/project/${projectId}/purchased-customers`}>已購客名單</Link>,
    },
    {
        key: 'sales-personnel',
        icon: <UserOutlined/>,
        label: <Link href={`/project/${projectId}/sales-personnel`}>銷售人員管理</Link>,
    },
    {
        key: 'questionnaire',
        icon: <FileTextOutlined/>,
        label: <Link href={`/project/${projectId}/visitor-questionnaire`}>訪客問卷</Link>,
    },
    {
        key: 'financial',
        icon: <DollarOutlined/>,
        label: '財務系統',
        children: [
            {
                key: 'financial-overview',
                icon: <DollarOutlined/>,
                label: <Link href={`/project/${projectId}/financial`}>財務總覽</Link>,
            },
            {
                key: 'budget',
                icon: <BankOutlined/>,
                label: <Link href={`/project/${projectId}/budget`}>預算規劃</Link>,
            },
            {
                key: 'expenses',
                icon: <CreditCardOutlined/>,
                label: <Link href={`/project/${projectId}/expenses`}>支出管理</Link>,
            },
            {
                key: 'commission',
                icon: <MoneyCollectOutlined/>,
                label: <Link href={`/project/${projectId}/commission`}>請傭列表</Link>,
            },
        ],
    },
    {
        key: 'handover',
        icon: <FileOutlined/>,
        label: <Link href={`/project/${projectId}/handover`}>點交屋管理</Link>,
    },
    {
        key: 'withdrawal',
        icon: <FallOutlined/>,
        label: <Link href={`/project/${projectId}/withdrawal`}>退戶記錄</Link>,
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
    const [searchValue, setSearchValue] = useState('')
    const [searchOptions, setSearchOptions] = useState<{value: string, label: string, path: string}[]>([])

    useEffect(() => {
        if (projectId) {
            fetchProject()
        }
    }, [projectId])

    // 生成搜索選項
    const generateSearchOptions = () => {
        const menuItems = getMenuItems(projectId)
        const options: {value: string, label: string, path: string}[] = []
        
        const extractItems = (items: MenuItem[]) => {
            items.forEach((item: any) => {
                if (item.children) {
                    extractItems(item.children)
                } else if (item.label && typeof item.label === 'object' && item.label.props?.href) {
                    const labelText = item.label.props.children
                    options.push({
                        value: labelText,
                        label: labelText,
                        path: item.label.props.href
                    })
                }
            })
        }
        
        extractItems(menuItems)
        return options
    }

    // 處理搜索
    const handleSearch = (value: string) => {
        setSearchValue(value)
        if (value) {
            const allOptions = generateSearchOptions()
            const filteredOptions = allOptions.filter(option => 
                option.label.toLowerCase().includes(value.toLowerCase())
            )
            setSearchOptions(filteredOptions)
        } else {
            setSearchOptions([])
        }
    }

    // 處理選擇
    const handleSelect = (value: string) => {
        const option = searchOptions.find(opt => opt.value === value)
        if (option) {
            router.push(option.path)
            setSearchValue('')
            setSearchOptions([])
        }
    }

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
                        <BuildOutlined style={{fontSize: '48px', color: '#1890ff'}}/>
                    </div>
                </Spin>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <BuildOutlined style={{fontSize: '48px', color: '#bfbfbf', marginBottom: '16px'}}/>
                    <Text type="secondary" style={{display: 'block', marginBottom: '16px'}}>建案不存在</Text>
                    <Button type="primary" onClick={() => router.push('/')}>
                        返回首頁
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Layout style={{minHeight: '100vh'}}>
            {/* 桌面端侧边栏 */}
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                breakpoint="lg"
                collapsedWidth="80" // Adjust collapsed width if needed
                onBreakpoint={(broken) => {
                    if (broken) {
                        setCollapsed(true)
                    }
                }}
                className="hidden lg:block"
                style={{
                    background: '#001529',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 100
                }}
            >
                <div style={{height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Link href="/"
                          style={{color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center'}}>
                        {!collapsed && <span style={{fontWeight: 'bold', fontSize: '16px'}}>HOSSO PRO</span>}
                    </Link>
                </div>
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['statistics']} items={getMenuItems(projectId)}
                      style={{background: '#001529'}}/>
            </Sider>

            {/* 移动端抽屉 */}
            <Drawer
                title={<Typography.Text style={{color: 'white'}}>HOSSO PRO</Typography.Text>}
                placement="left"
                onClose={() => setMobileDrawerOpen(false)}
                open={mobileDrawerOpen}
                styles={{
                    body: {padding: 0, background: '#001529'},
                    header: {background: '#001529', borderBottom: '1px solid #002140'}
                }}
                width={256}
                className="lg:hidden"
            >
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={['statistics']}
                    items={getMenuItems(projectId)}
                    onClick={() => setMobileDrawerOpen(false)}
                    style={{background: '#001529'}}
                />
            </Drawer>

            <Layout className="lg:ml-0" style={{marginLeft: collapsed ? '80px' : '200px'}}>
                {/* 顶部导航栏 */}
                <Header className="lg:left-0" style={{
                    background: '#fff',
                    padding: '0 16px',
                    boxShadow: '0 1px 4px rgba(0,21,41,.08)',
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    left: collapsed ? '80px' : '200px',
                    zIndex: 99
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: '100%'
                    }}>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <Button
                                type="text"
                                icon={<MenuOutlined/>}
                                onClick={() => setMobileDrawerOpen(true)}
                                style={{marginRight: '16px'}}
                                className="lg:hidden"
                            />
                            <Link href="/" style={{
                                display: 'flex',
                                alignItems: 'center',
                                textDecoration: 'none',
                                color: 'inherit'
                            }}>
                                <BuildOutlined style={{fontSize: '24px', color: '#1890ff', marginRight: '8px'}}/>
                                <Title level={4} style={{margin: 0, color: '#1f2937'}}>銷售管理系統</Title>
                            </Link>
                        </div>
                        
                        {/* 菜單搜索 */}
                        <div style={{
                            flex: 1, 
                            display: 'flex', 
                            justifyContent: 'center', 
                            maxWidth: '400px', 
                            margin: '0 24px'
                        }} className="hidden md:flex">
                            <AutoComplete
                                value={searchValue}
                                options={searchOptions.map(option => ({
                                    value: option.value,
                                    label: (
                                        <div style={{
                                            display: 'flex', 
                                            alignItems: 'center',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            transition: 'background-color 0.2s'
                                        }}>
                                            <SearchOutlined style={{marginRight: '8px', color: '#1890ff', fontSize: '14px'}} />
                                            <span style={{fontSize: '14px'}}>{option.label}</span>
                                        </div>
                                    )
                                }))}
                                onSearch={handleSearch}
                                onSelect={handleSelect}
                                placeholder="搜索菜單功能..."
                                style={{width: '100%'}}
                                allowClear
                                filterOption={false}
                                styles={{
                                    popup: {
                                        root: {
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                        }
                                    }
                                }}
                            >
                                <Input
                                    prefix={<SearchOutlined style={{color: '#bfbfbf'}} />}
                                    style={{
                                        borderRadius: '20px',
                                        backgroundColor: '#f8f9fa',
                                        border: '1px solid #e1e5e9',
                                        height: '36px',
                                        fontSize: '14px',
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.backgroundColor = '#ffffff'
                                        e.target.style.borderColor = '#1890ff'
                                        e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)'
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.backgroundColor = '#f8f9fa'
                                        e.target.style.borderColor = '#e1e5e9'
                                        e.target.style.boxShadow = 'none'
                                    }}
                                />
                            </AutoComplete>
                        </div>
                        
                        <div style={{textAlign: 'right'}}>
                            <Title level={5} style={{margin: 0, color: '#1f2937'}}>{project.name}</Title>
                            <Text type="secondary">建案管理</Text>
                        </div>
                    </div>
                </Header>

                {/* 主内容区域 */}
                <Content style={{
                    margin: '24px 16px',
                    marginTop: '88px', // 64px header height + 24px margin
                    padding: '24px',
                    background: '#fff',
                    minHeight: 280
                }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    )
}