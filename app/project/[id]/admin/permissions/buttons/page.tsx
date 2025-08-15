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
  Checkbox,
  Alert,
  Divider,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  SettingOutlined,
  TeamOutlined,
  EyeOutlined,
  BranchesOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input
const { Search } = Input

interface ButtonPermission {
  id: number
  name: string
  displayName: string
  description: string
  category: string
  isActive: boolean
  rolePermissions?: Array<{
    role: {
      id: number
      name: string
      displayName: string
    }
  }>
  createdAt: string
  updatedAt: string
}

interface Role {
  id: number
  name: string
  displayName: string
  isActive: boolean
}

interface PermissionMatrix {
  [roleId: number]: {
    [buttonId: number]: boolean
  }
}

const BUTTON_CATEGORIES = [
  { value: 'create', label: '創建操作' },
  { value: 'read', label: '查看操作' },
  { value: 'update', label: '更新操作' },
  { value: 'delete', label: '刪除操作' },
  { value: 'export', label: '導出操作' },
  { value: 'import', label: '導入操作' },
  { value: 'approve', label: '審批操作' },
  { value: 'other', label: '其他操作' }
]

export default function ButtonPermissions() {
  const [buttons, setButtons] = useState<ButtonPermission[]>([])
  const [filteredButtons, setFilteredButtons] = useState<ButtonPermission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [matrixDrawerVisible, setMatrixDrawerVisible] = useState(false)
  const [editingButton, setEditingButton] = useState<ButtonPermission | null>(null)
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({})
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [form] = Form.useForm()

  // 獲取按鈕權限列表
  const fetchButtons = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/permissions/buttons')
      if (!response.ok) throw new Error('獲取按鈕權限列表失敗')
      const data = await response.json()
      setButtons(data.data || [])
      setFilteredButtons(data.data || [])
    } catch (error) {
      console.error('獲取按鈕權限列表失敗:', error)
      message.error('獲取按鈕權限列表失敗')
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

  // 獲取權限矩陣
  const fetchPermissionMatrix = async () => {
    try {
      const matrix: PermissionMatrix = {}
      
      for (const role of roles) {
        const response = await fetch(`/api/admin/permissions/buttons?roleId=${role.id}`)
        if (response.ok) {
          const data = await response.json()
          matrix[role.id] = {}
          
          data.data.forEach((button: ButtonPermission) => {
            matrix[role.id][button.id] = button.rolePermissions?.some(
              rp => rp.role.id === role.id
            ) || false
          })
        }
      }
      
      setPermissionMatrix(matrix)
    } catch (error) {
      console.error('獲取權限矩陣失敗:', error)
    }
  }

  useEffect(() => {
    fetchButtons()
    fetchRoles()
  }, [])

  useEffect(() => {
    if (roles.length > 0) {
      fetchPermissionMatrix()
    }
  }, [roles])

  // 搜索和篩選
  useEffect(() => {
    let filtered = buttons
    
    if (searchText) {
      filtered = filtered.filter(button => 
        button.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
        button.name.toLowerCase().includes(searchText.toLowerCase()) ||
        button.description.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(button => button.category === selectedCategory)
    }
    
    setFilteredButtons(filtered)
  }, [buttons, searchText, selectedCategory])

  // 創建或更新按鈕權限
  const handleSaveButton = async (values: any) => {
    try {
      const url = editingButton ? `/api/admin/permissions/buttons/${editingButton.id}` : '/api/admin/permissions/buttons'
      const method = editingButton ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失敗')
      }
      
      message.success(editingButton ? '按鈕權限更新成功' : '按鈕權限創建成功')
      setModalVisible(false)
      setEditingButton(null)
      form.resetFields()
      fetchButtons()
    } catch (error: any) {
      console.error('保存按鈕權限失敗:', error)
      message.error(error.message || '保存按鈕權限失敗')
    }
  }

  // 刪除按鈕權限
  const handleDeleteButton = async (buttonId: number) => {
    try {
      const response = await fetch(`/api/admin/permissions/buttons/${buttonId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '刪除失敗')
      }
      
      message.success('按鈕權限刪除成功')
      fetchButtons()
    } catch (error: any) {
      console.error('刪除按鈕權限失敗:', error)
      message.error(error.message || '刪除按鈕權限失敗')
    }
  }

  // 更新權限矩陣
  const handleUpdatePermissionMatrix = async () => {
    try {
      const updates = []
      
      for (const roleId in permissionMatrix) {
        const buttonIds = Object.keys(permissionMatrix[roleId])
          .filter(buttonId => permissionMatrix[roleId][parseInt(buttonId)])
          .map(buttonId => parseInt(buttonId))
        
        updates.push({
          roleId: parseInt(roleId),
          buttonIds
        })
      }
      
      // 批量更新權限
      for (const update of updates) {
        const response = await fetch('/api/admin/permissions/buttons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        })
        
        if (!response.ok) {
          throw new Error('權限更新失敗')
        }
      }
      
      message.success('權限矩陣更新成功')
      setMatrixDrawerVisible(false)
      fetchButtons()
    } catch (error: any) {
      console.error('更新權限矩陣失敗:', error)
      message.error(error.message || '更新權限矩陣失敗')
    }
  }

  // 獲取分類顏色
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      create: 'green',
      read: 'blue',
      update: 'orange',
      delete: 'red',
      export: 'purple',
      import: 'cyan',
      approve: 'gold',
      other: 'default'
    }
    return colors[category] || 'default'
  }

  // 獲取分類統計
  const getCategoryStats = () => {
    const stats: { [key: string]: number } = {}
    buttons.forEach(button => {
      stats[button.category] = (stats[button.category] || 0) + 1
    })
    return stats
  }

  const columns: ColumnsType<ButtonPermission> = [
    {
      title: '權限名稱',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <Text type="secondary" className="text-xs">{record.name}</Text>
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '分類',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        const categoryInfo = BUTTON_CATEGORIES.find(c => c.value === category)
        return (
          <Tag color={getCategoryColor(category)}>
            {categoryInfo?.label || category}
          </Tag>
        )
      },
      filters: BUTTON_CATEGORIES.map(cat => ({ text: cat.label, value: cat.value })),
      onFilter: (value, record) => record.category === value
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
      title: '授權角色',
      key: 'roles',
      render: (_, record) => (
        <div className="flex flex-wrap gap-1">
          {record.rolePermissions?.map(rp => (
            <Tag key={rp.role.id} color="blue" className="text-xs">
              {rp.role.displayName}
            </Tag>
          )) || <Text type="secondary">無</Text>}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="編輯">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingButton(record)
                form.setFieldsValue(record)
                setModalVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title="刪除">
            <Popconfirm
              title="確定要刪除這個按鈕權限嗎？"
              description="刪除後無法恢復，請確認操作"
              onConfirm={() => handleDeleteButton(record.id)}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ]

  const categoryStats = getCategoryStats()

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="!mb-2">
            <KeyOutlined className="mr-2" />
            按鈕權限管理
          </Title>
          <Text type="secondary">管理系統按鈕操作權限和角色分配</Text>
        </div>
        <Space>
          <Button
            icon={<BranchesOutlined />}
            onClick={() => {
              fetchPermissionMatrix()
              setMatrixDrawerVisible(true)
            }}
          >
            權限矩陣
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingButton(null)
              form.resetFields()
              setModalVisible(true)
            }}
          >
            新增按鈕權限
          </Button>
        </Space>
      </div>

      {/* 統計信息 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="總權限數"
              value={buttons.length}
              prefix={<KeyOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="啟用權限"
              value={buttons.filter(b => b.isActive).length}
              prefix={<SettingOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="權限分類"
              value={Object.keys(categoryStats).length}
              prefix={<FilterOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="授權角色"
              value={roles.filter(r => r.isActive).length}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 分類統計 */}
      <Card title="權限分類統計">
        <Row gutter={[16, 16]}>
          {BUTTON_CATEGORIES.map(category => (
            <Col key={category.value} xs={12} sm={8} md={6} lg={4} xl={3}>
              <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold" style={{ color: `var(--ant-color-${getCategoryColor(category.value)})` }}>
                  {categoryStats[category.value] || 0}
                </div>
                <div className="text-sm text-gray-600">{category.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 搜索和篩選 */}
      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索權限名稱、標識或描述"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="選擇權限分類"
              allowClear
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: '100%' }}
            >
              {BUTTON_CATEGORIES.map(category => (
                <Option key={category.value} value={category.value}>
                  {category.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* 按鈕權限列表 */}
        <Table
          columns={columns}
          dataSource={filteredButtons}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`
          }}
        />
      </Card>

      {/* 創建/編輯按鈕權限模態框 */}
      <Modal
        title={editingButton ? '編輯按鈕權限' : '新增按鈕權限'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingButton(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveButton}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="權限標識"
                rules={[
                  { required: true, message: '請輸入權限標識' },
                  { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '權限標識格式不正確' }
                ]}
              >
                <Input placeholder="例如：user_create" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="displayName"
                label="顯示名稱"
                rules={[{ required: true, message: '請輸入顯示名稱' }]}
              >
                <Input placeholder="例如：創建用戶" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="權限描述"
            rules={[{ required: true, message: '請輸入權限描述' }]}
          >
            <TextArea rows={3} placeholder="描述這個按鈕權限的具體功能" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="權限分類"
                rules={[{ required: true, message: '請選擇權限分類' }]}
              >
                <Select placeholder="選擇權限分類">
                  {BUTTON_CATEGORIES.map(category => (
                    <Option key={category.value} value={category.value}>
                      {category.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="啟用狀態"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="啟用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
          </Row>
          
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit">
              {editingButton ? '更新' : '創建'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 權限矩陣抽屜 */}
      <Drawer
        title="按鈕權限矩陣"
        open={matrixDrawerVisible}
        onClose={() => setMatrixDrawerVisible(false)}
        width={900}
        footer={
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setMatrixDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleUpdatePermissionMatrix}>
              保存配置
            </Button>
          </div>
        }
      >
        <Alert
          message="按鈕權限矩陣配置"
          description="勾選表示該角色擁有對應按鈕的操作權限"
          type="info"
          showIcon
          className="mb-4"
        />
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left sticky left-0 bg-gray-50 z-10">
                  按鈕權限
                </th>
                {roles.map(role => (
                  <th key={role.id} className="border border-gray-300 p-2 text-center min-w-24">
                    <div className="text-xs">{role.displayName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BUTTON_CATEGORIES.map(category => {
                const categoryButtons = buttons.filter(b => b.category === category.value)
                if (categoryButtons.length === 0) return null
                
                return [
                  <tr key={`category-${category.value}`} className="bg-gray-100">
                    <td 
                      colSpan={roles.length + 1} 
                      className="border border-gray-300 p-2 font-medium sticky left-0 bg-gray-100 z-10"
                    >
                      <Tag color={getCategoryColor(category.value)}>{category.label}</Tag>
                    </td>
                  </tr>,
                  ...categoryButtons.map(button => (
                    <tr key={button.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 sticky left-0 bg-white z-10">
                        <div>
                          <div className="font-medium">{button.displayName}</div>
                          <Text type="secondary" className="text-xs">({button.name})</Text>
                        </div>
                      </td>
                      {roles.map(role => (
                        <td key={role.id} className="border border-gray-300 p-2 text-center">
                          <Checkbox
                            checked={permissionMatrix[role.id]?.[button.id] || false}
                            onChange={(e) => {
                              setPermissionMatrix(prev => ({
                                ...prev,
                                [role.id]: {
                                  ...prev[role.id],
                                  [button.id]: e.target.checked
                                }
                              }))
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ]
              })}
            </tbody>
          </table>
        </div>
      </Drawer>
    </div>
  )
}