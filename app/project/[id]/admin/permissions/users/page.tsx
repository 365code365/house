'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Card,
  Typography,
  Row,
  Col,
  Space,
  Popconfirm,
  message,
  Tag,
  Tooltip,
  Badge,
  Drawer,
  Descriptions,
  Alert,
  Divider,
  Statistic,
  Avatar,
  List,
  Tabs,
  Tree
} from 'antd'
import {
  UserOutlined,
  EditOutlined,
  EyeOutlined,
  TeamOutlined,
  SettingOutlined,
  KeyOutlined,
  SearchOutlined,
  FilterOutlined,
  UserAddOutlined,
  SafetyOutlined,
  AuditOutlined,
  BranchesOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input
const { TabPane } = Tabs

interface User {
  id: number
  name: string
  email: string
  role: string
  isActive: boolean
  projectIds: number[]
  createdAt: string
  updatedAt: string
  roleInfo?: {
    id: number
    name: string
    displayName: string
    description: string
  }
  projects?: Array<{
    id: number
    name: string
  }>
}

interface Role {
  id: number
  name: string
  displayName: string
  description: string
  isActive: boolean
}

interface Project {
  id: number
  name: string
  description: string
}

interface UserPermissions {
  menus: Array<{
    id: number
    name: string
    displayName: string
    path: string
    parentId: number | null
    children?: UserPermissions['menus']
  }>
  buttons: Array<{
    id: number
    name: string
    displayName: string
    category: string
  }>
}

interface BatchUpdateData {
  userIds: number[]
  role?: string
  isActive?: boolean
  projectIds?: number[]
}

export default function UserPermissions() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedRole, setSelectedRole] = useState<string | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<boolean | undefined>()
  const [form] = Form.useForm()
  const [batchForm] = Form.useForm()

  // 獲取用戶列表
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/permissions/users')
      if (!response.ok) throw new Error('獲取用戶列表失敗')
      const data = await response.json()
      setUsers(data.data || [])
      setFilteredUsers(data.data || [])
    } catch (error) {
      console.error('獲取用戶列表失敗:', error)
      message.error('獲取用戶列表失敗')
    } finally {
      setLoading(false)
    }
  }

  // 獲取角色列表
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      if (!response.ok) throw new Error('獲取角色列表失敗')
      const data = await response.json()
      setRoles(data.data || [])
    } catch (error) {
      console.error('獲取角色列表失敗:', error)
    }
  }

  // 獲取項目列表
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('獲取項目列表失敗')
      const data = await response.json()
      setProjects(data.data || [])
    } catch (error) {
      console.error('獲取項目列表失敗:', error)
    }
  }

  // 獲取用戶詳細權限
  const fetchUserPermissions = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/permissions/users/${userId}`)
      if (!response.ok) throw new Error('獲取用戶權限失敗')
      const data = await response.json()
      setUserPermissions(data.permissions)
    } catch (error) {
      console.error('獲取用戶權限失敗:', error)
      message.error('獲取用戶權限失敗')
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchProjects()
  }, [])

  // 搜索和篩選
  useEffect(() => {
    let filtered = users
    
    if (searchText) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    
    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole)
    }
    
    if (selectedStatus !== undefined) {
      filtered = filtered.filter(user => user.isActive === selectedStatus)
    }
    
    setFilteredUsers(filtered)
  }, [users, searchText, selectedRole, selectedStatus])

  // 更新用戶權限
  const handleUpdateUser = async (userId: number, values: any) => {
    try {
      const response = await fetch(`/api/admin/permissions/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新失敗')
      }
      
      message.success('用戶權限更新成功')
      fetchUsers()
    } catch (error: any) {
      console.error('更新用戶權限失敗:', error)
      message.error(error.message || '更新用戶權限失敗')
    }
  }

  // 批量更新用戶
  const handleBatchUpdate = async (values: any) => {
    try {
      const updateData: BatchUpdateData = {
        userIds: selectedRowKeys as number[],
        ...values
      }
      
      const response = await fetch('/api/admin/permissions/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '批量更新失敗')
      }
      
      message.success('批量更新成功')
      setBatchModalVisible(false)
      setSelectedRowKeys([])
      batchForm.resetFields()
      fetchUsers()
    } catch (error: any) {
      console.error('批量更新失敗:', error)
      message.error(error.message || '批量更新失敗')
    }
  }

  // 查看用戶詳情
  const handleViewUser = async (user: User) => {
    setSelectedUser(user)
    await fetchUserPermissions(user.id)
    setDetailDrawerVisible(true)
  }

  // 構建菜單樹
  const buildMenuTree = (menus: UserPermissions['menus']): DataNode[] => {
    const menuMap = new Map()
    const roots: DataNode[] = []
    
    // 創建節點映射
    menus.forEach(menu => {
      menuMap.set(menu.id, {
        key: menu.id,
        title: menu.displayName,
        children: []
      })
    })
    
    // 構建樹結構
    menus.forEach(menu => {
      const node = menuMap.get(menu.id)
      if (menu.parentId && menuMap.has(menu.parentId)) {
        menuMap.get(menu.parentId).children.push(node)
      } else {
        roots.push(node)
      }
    })
    
    return roots
  }

  // 獲取角色統計
  const getRoleStats = () => {
    const stats: { [key: string]: number } = {}
    users.forEach(user => {
      const roleDisplay = user.roleInfo?.displayName || user.role
      stats[roleDisplay] = (stats[roleDisplay] || 0) + 1
    })
    return stats
  }

  const columns: ColumnsType<User> = [
    {
      title: '用戶信息',
      key: 'userInfo',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.name}</div>
            <Text type="secondary" className="text-xs">{record.email}</Text>
          </div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => (
        <Tag color="blue">
          {record.roleInfo?.displayName || role}
        </Tag>
      ),
      filters: roles.map(role => ({ text: role.displayName, value: role.name })),
      onFilter: (value, record) => record.role === value
    },
    {
      title: '狀態',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Badge
          status={isActive ? 'success' : 'default'}
          text={isActive ? '啟用' : '停用'}
        />
      ),
      filters: [
        { text: '啟用', value: true },
        { text: '停用', value: false }
      ],
      onFilter: (value, record) => record.isActive === value
    },
    {
      title: '項目權限',
      key: 'projects',
      render: (_, record) => (
        <div className="flex flex-wrap gap-1">
          {record.projects?.map(project => (
            <Tag key={project.id} color="green" className="text-xs">
              {project.name}
            </Tag>
          )) || <Text type="secondary">無</Text>}
        </div>
      )
    },
    {
      title: '最後更新',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => new Date(date).toLocaleDateString('zh-TW')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看詳情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewUser(record)}
            />
          </Tooltip>
          <Tooltip title="編輯權限">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                form.setFieldsValue({
                  role: record.role,
                  isActive: record.isActive,
                  projectIds: record.projectIds
                })
                Modal.confirm({
                  title: '編輯用戶權限',
                  content: (
                    <Form
                      form={form}
                      layout="vertical"
                      className="mt-4"
                    >
                      <Form.Item
                        name="role"
                        label="角色"
                        rules={[{ required: true, message: '請選擇角色' }]}
                      >
                        <Select placeholder="選擇角色">
                          {roles.map(role => (
                            <Option key={role.name} value={role.name}>
                              {role.displayName}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item
                        name="isActive"
                        label="啟用狀態"
                        valuePropName="checked"
                      >
                        <Switch checkedChildren="啟用" unCheckedChildren="停用" />
                      </Form.Item>
                      
                      <Form.Item
                        name="projectIds"
                        label="項目權限"
                      >
                        <Select
                          mode="multiple"
                          placeholder="選擇可訪問的項目"
                          allowClear
                        >
                          {projects.map(project => (
                            <Option key={project.id} value={project.id}>
                              {project.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Form>
                  ),
                  onOk: async () => {
                    const values = await form.validateFields()
                    await handleUpdateUser(record.id, values)
                  },
                  width: 500
                })
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const roleStats = getRoleStats()

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="!mb-2">
            <UserOutlined className="mr-2" />
            用戶權限管理
          </Title>
          <Text type="secondary">管理用戶角色分配和項目訪問權限</Text>
        </div>
        <Space>
          <Button
            icon={<SettingOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={() => {
              batchForm.resetFields()
              setBatchModalVisible(true)
            }}
          >
            批量操作 ({selectedRowKeys.length})
          </Button>
        </Space>
      </div>

      {/* 統計信息 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="總用戶數"
              value={users.length}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="啟用用戶"
              value={users.filter(u => u.isActive).length}
              prefix={<SafetyOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="角色類型"
              value={Object.keys(roleStats).length}
              prefix={<TeamOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="項目數量"
              value={projects.length}
              prefix={<BranchesOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 角色統計 */}
      <Card title="角色分佈統計">
        <Row gutter={[16, 16]}>
          {Object.entries(roleStats).map(([role, count]) => (
            <Col key={role} xs={12} sm={8} md={6} lg={4} xl={3}>
              <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-gray-600">{role}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 搜索和篩選 */}
      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Search
              placeholder="搜索用戶名稱或郵箱"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="選擇角色"
              allowClear
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: '100%' }}
            >
              {roles.map(role => (
                <Option key={role.name} value={role.name}>
                  {role.displayName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="選擇狀態"
              allowClear
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: '100%' }}
            >
              <Option value={true}>啟用</Option>
              <Option value={false}>停用</Option>
            </Select>
          </Col>
        </Row>

        {/* 用戶列表 */}
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.role === 'SUPER_ADMIN' // 超級管理員不能批量操作
            })
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`
          }}
        />
      </Card>

      {/* 用戶詳情抽屜 */}
      <Drawer
        title="用戶權限詳情"
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false)
          setSelectedUser(null)
          setUserPermissions(null)
        }}
        width={800}
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* 基本信息 */}
            <Card title="基本信息">
              <Descriptions column={2}>
                <Descriptions.Item label="用戶名稱">{selectedUser.name}</Descriptions.Item>
                <Descriptions.Item label="郵箱地址">{selectedUser.email}</Descriptions.Item>
                <Descriptions.Item label="當前角色">
                  <Tag color="blue">{selectedUser.roleInfo?.displayName || selectedUser.role}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="狀態">
                  <Badge
                    status={selectedUser.isActive ? 'success' : 'default'}
                    text={selectedUser.isActive ? '啟用' : '停用'}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="創建時間">
                  {new Date(selectedUser.createdAt).toLocaleString('zh-TW')}
                </Descriptions.Item>
                <Descriptions.Item label="更新時間">
                  {new Date(selectedUser.updatedAt).toLocaleString('zh-TW')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 項目權限 */}
            <Card title="項目權限">
              <div className="flex flex-wrap gap-2">
                {selectedUser.projects?.map(project => (
                  <Tag key={project.id} color="green">
                    {project.name}
                  </Tag>
                )) || <Text type="secondary">無項目權限</Text>}
              </div>
            </Card>

            {/* 權限詳情 */}
            {userPermissions && (
              <Card title="權限詳情">
                <Tabs defaultActiveKey="menus">
                  <TabPane tab="菜單權限" key="menus">
                    {userPermissions.menus.length > 0 ? (
                      <Tree
                        treeData={buildMenuTree(userPermissions.menus)}
                        defaultExpandAll
                        showIcon={false}
                      />
                    ) : (
                      <Alert message="無菜單權限" type="info" />
                    )}
                  </TabPane>
                  
                  <TabPane tab="按鈕權限" key="buttons">
                    {userPermissions.buttons.length > 0 ? (
                      <List
                        dataSource={userPermissions.buttons}
                        renderItem={(button) => (
                          <List.Item>
                            <List.Item.Meta
                              title={button.displayName}
                              description={`${button.name} (${button.category})`}
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Alert message="無按鈕權限" type="info" />
                    )}
                  </TabPane>
                </Tabs>
              </Card>
            )}
          </div>
        )}
      </Drawer>

      {/* 批量操作模態框 */}
      <Modal
        title="批量操作用戶"
        open={batchModalVisible}
        onCancel={() => {
          setBatchModalVisible(false)
          batchForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Alert
          message={`已選擇 ${selectedRowKeys.length} 個用戶`}
          description="批量操作將應用到所有選中的用戶"
          type="info"
          showIcon
          className="mb-4"
        />
        
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchUpdate}
        >
          <Form.Item
            name="role"
            label="角色"
          >
            <Select placeholder="選擇角色（不選擇則不修改）" allowClear>
              {roles.map(role => (
                <Option key={role.name} value={role.name}>
                  {role.displayName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="isActive"
            label="啟用狀態"
          >
            <Select placeholder="選擇狀態（不選擇則不修改）" allowClear>
              <Option value={true}>啟用</Option>
              <Option value={false}>停用</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="projectIds"
            label="項目權限"
          >
            <Select
              mode="multiple"
              placeholder="選擇項目（不選擇則不修改）"
              allowClear
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setBatchModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit">
              確認更新
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}