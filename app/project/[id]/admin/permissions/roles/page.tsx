'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Tag,
  Space,
  Popconfirm,
  message,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  Drawer,
  Tree,
  Checkbox
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  SettingOutlined,
  EyeOutlined,
  UserOutlined,
  MenuOutlined,
  KeyOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'

const { Title, Text } = Typography
const { TextArea } = Input

interface Role {
  id: number
  name: string
  displayName: string
  description: string
  isSystem: boolean
  isActive: boolean
  userCount: number
  menuPermissions: Array<{
    menu: {
      id: number
      name: string
      displayName: string
    }
  }>
  buttonPermissions: Array<{
    buttonPermission: {
      id: number
      name: string
      displayName: string
    }
  }>
  createdAt: string
  updatedAt: string
}

interface Menu {
  id: number
  name: string
  displayName: string
  parentId?: number
  children?: Menu[]
}

interface ButtonPermission {
  id: number
  name: string
  displayName: string
  description: string
}

export default function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [buttons, setButtons] = useState<ButtonPermission[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [permissionDrawerVisible, setPermissionDrawerVisible] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [form] = Form.useForm()
  const [permissionForm] = Form.useForm()

  // 獲取角色列表
  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/roles')
      if (!response.ok) throw new Error('獲取角色列表失敗')
      const data = await response.json()
      setRoles(data.data || [])
    } catch (error) {
      console.error('獲取角色列表失敗:', error)
      message.error('獲取角色列表失敗')
    } finally {
      setLoading(false)
    }
  }

  // 獲取菜單和按鈕權限
  const fetchPermissions = async () => {
    try {
      const [menusRes, buttonsRes] = await Promise.all([
        fetch('/api/admin/permissions/menus'),
        fetch('/api/admin/permissions/buttons')
      ])
      
      if (menusRes.ok) {
        const menusData = await menusRes.json()
        setMenus(menusData.data || [])
      }
      
      if (buttonsRes.ok) {
        const buttonsData = await buttonsRes.json()
        setButtons(buttonsData.data || [])
      }
    } catch (error) {
      console.error('獲取權限數據失敗:', error)
    }
  }

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  // 創建或更新角色
  const handleSaveRole = async (values: any) => {
    try {
      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles'
      const method = editingRole ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失敗')
      }
      
      message.success(editingRole ? '角色更新成功' : '角色創建成功')
      setModalVisible(false)
      setEditingRole(null)
      form.resetFields()
      fetchRoles()
    } catch (error: any) {
      console.error('保存角色失敗:', error)
      message.error(error.message || '保存角色失敗')
    }
  }

  // 刪除角色
  const handleDeleteRole = async (roleId: number) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '刪除失敗')
      }
      
      message.success('角色刪除成功')
      fetchRoles()
    } catch (error: any) {
      console.error('刪除角色失敗:', error)
      message.error(error.message || '刪除角色失敗')
    }
  }

  // 配置角色權限
  const handleConfigurePermissions = (role: Role) => {
    setSelectedRole(role)
    setPermissionDrawerVisible(true)
    
    // 設置表單初始值
    const menuIds = role.menuPermissions.map(mp => mp.menu.id)
    const buttonIds = role.buttonPermissions.map(bp => bp.buttonPermission.id)
    
    permissionForm.setFieldsValue({
      menuIds,
      buttonIds
    })
  }

  // 保存權限配置
  const handleSavePermissions = async (values: any) => {
    if (!selectedRole) return
    
    try {
      // 更新菜單權限
      const menuResponse = await fetch('/api/admin/permissions/menus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole.id,
          menuIds: values.menuIds || []
        })
      })
      
      // 更新按鈕權限
      const buttonResponse = await fetch('/api/admin/permissions/buttons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole.id,
          buttonIds: values.buttonIds || []
        })
      })
      
      if (!menuResponse.ok || !buttonResponse.ok) {
        throw new Error('權限配置失敗')
      }
      
      message.success('權限配置成功')
      setPermissionDrawerVisible(false)
      setSelectedRole(null)
      permissionForm.resetFields()
      fetchRoles()
    } catch (error: any) {
      console.error('保存權限配置失敗:', error)
      message.error(error.message || '保存權限配置失敗')
    }
  }

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
    
    // 轉換為 Tree 組件需要的格式
    const convertToTreeData = (nodes: (Menu & { children: Menu[] })[]): DataNode[] => {
      return nodes.map(node => ({
        key: node.id,
        title: node.displayName,
        children: node.children && node.children.length > 0 ? convertToTreeData(node.children as (Menu & { children: Menu[] })[]) : undefined
      }))
    }
    
    return convertToTreeData(roots)
  }

  const columns: ColumnsType<Role> = [
    {
      title: '角色名稱',
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
      title: '類型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      render: (isSystem) => (
        <Tag color={isSystem ? 'red' : 'blue'}>
          {isSystem ? '系統角色' : '自定義角色'}
        </Tag>
      )
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
      )
    },
    {
      title: '用戶數量',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '權限數量',
      key: 'permissions',
      render: (_, record) => (
        <Space>
          <Tooltip title="菜單權限">
            <Tag icon={<MenuOutlined />} color="blue">
              {record.menuPermissions.length}
            </Tag>
          </Tooltip>
          <Tooltip title="按鈕權限">
            <Tag icon={<KeyOutlined />} color="green">
              {record.buttonPermissions.length}
            </Tag>
          </Tooltip>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看權限">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleConfigurePermissions(record)}
            />
          </Tooltip>
          <Tooltip title="編輯角色">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRole(record)
                form.setFieldsValue(record)
                setModalVisible(true)
              }}
              disabled={record.isSystem}
            />
          </Tooltip>
          <Tooltip title="刪除角色">
            <Popconfirm
              title="確定要刪除這個角色嗎？"
              description="刪除後無法恢復，請確認操作"
              onConfirm={() => handleDeleteRole(record.id)}
              disabled={record.isSystem || record.userCount > 0}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={record.isSystem || record.userCount > 0}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* 頁面標題和統計 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="!mb-2">
            <TeamOutlined className="mr-2" />
            角色管理
          </Title>
          <Text type="secondary">管理系統角色和權限配置</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRole(null)
            form.resetFields()
            setModalVisible(true)
          }}
        >
          新增角色
        </Button>
      </div>

      {/* 統計卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="總角色數"
              value={roles.length}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="系統角色"
              value={roles.filter(r => r.isSystem).length}
              prefix={<SettingOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="自定義角色"
              value={roles.filter(r => !r.isSystem).length}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 角色列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 個角色`
          }}
        />
      </Card>

      {/* 創建/編輯角色模態框 */}
      <Modal
        title={editingRole ? '編輯角色' : '新增角色'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingRole(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveRole}
        >
          <Form.Item
            name="name"
            label="角色標識"
            rules={[
              { required: true, message: '請輸入角色標識' },
              { pattern: /^[A-Z_]+$/, message: '角色標識只能包含大寫字母和下劃線' }
            ]}
          >
            <Input placeholder="例如：CUSTOM_ROLE" />
          </Form.Item>
          
          <Form.Item
            name="displayName"
            label="顯示名稱"
            rules={[{ required: true, message: '請輸入顯示名稱' }]}
          >
            <Input placeholder="例如：自定義角色" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="角色描述"
            rules={[{ required: true, message: '請輸入角色描述' }]}
          >
            <TextArea rows={3} placeholder="描述角色的職責和用途" />
          </Form.Item>
          
          <Form.Item
            name="isActive"
            label="啟用狀態"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="啟用" unCheckedChildren="停用" />
          </Form.Item>
          
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit">
              {editingRole ? '更新' : '創建'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 權限配置抽屜 */}
      <Drawer
        title={`配置權限 - ${selectedRole?.displayName}`}
        open={permissionDrawerVisible}
        onClose={() => {
          setPermissionDrawerVisible(false)
          setSelectedRole(null)
          permissionForm.resetFields()
        }}
        width={600}
        footer={
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setPermissionDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={() => permissionForm.submit()}>
              保存配置
            </Button>
          </div>
        }
      >
        <Form
          form={permissionForm}
          layout="vertical"
          onFinish={handleSavePermissions}
        >
          <Form.Item
            name="menuIds"
            label="菜單權限"
          >
            <Tree
              checkable
              treeData={buildMenuTree(menus)}
              checkedKeys={permissionForm.getFieldValue('menuIds') || []}
              onCheck={(checkedKeys) => {
                permissionForm.setFieldsValue({ menuIds: checkedKeys })
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="buttonIds"
            label="按鈕權限"
          >
            <Checkbox.Group
              options={buttons.map(button => ({
                label: button.displayName,
                value: button.id
              }))}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}