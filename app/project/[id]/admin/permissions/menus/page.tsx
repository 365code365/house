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
  Tree,
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
  Divider,
  Alert
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MenuOutlined,
  FolderOutlined,
  FileOutlined,
  SettingOutlined,
  TeamOutlined,
  EyeOutlined,
  BranchesOutlined,
  MinusOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

interface Menu {
  id: number
  name: string
  displayName: string
  path?: string
  icon?: string
  parentId?: number
  sortOrder: number
  isActive: boolean
  description?: string
  children?: Menu[]
  parent?: {
    id: number
    displayName: string
  }
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
    [menuId: number]: boolean
  }
}

export default function MenuPermissions() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [matrixDrawerVisible, setMatrixDrawerVisible] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({})
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm()

  // 獲取菜單列表
  const fetchMenus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/permissions/menus')
      if (!response.ok) throw new Error('獲取菜單列表失敗')
      const data = await response.json()
      setMenus(data.data || [])
      
      // 默認展開所有節點
      const allKeys = (data.data || []).map((menu: Menu) => menu.id)
      setExpandedKeys(allKeys)
    } catch (error) {
      console.error('獲取菜單列表失敗:', error)
      message.error('獲取菜單列表失敗')
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
        const response = await fetch(`/api/admin/permissions/menus?roleId=${role.id}`)
        if (response.ok) {
          const data = await response.json()
          matrix[role.id] = {}
          
          data.data.forEach((menu: Menu) => {
            matrix[role.id][menu.id] = menu.rolePermissions?.some(
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
    fetchMenus()
    fetchRoles()
  }, [])

  useEffect(() => {
    if (roles.length > 0) {
      fetchPermissionMatrix()
    }
  }, [roles])

  // 創建或更新菜單
  const handleSaveMenu = async (values: any) => {
    try {
      const url = editingMenu ? `/api/admin/permissions/menus/${editingMenu.id}` : '/api/admin/permissions/menus'
      const method = editingMenu ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失敗')
      }
      
      message.success(editingMenu ? '菜單更新成功' : '菜單創建成功')
      setModalVisible(false)
      setEditingMenu(null)
      form.resetFields()
      fetchMenus()
    } catch (error: any) {
      console.error('保存菜單失敗:', error)
      message.error(error.message || '保存菜單失敗')
    }
  }

  // 刪除菜單
  const handleDeleteMenu = async (menuId: number) => {
    try {
      const response = await fetch(`/api/admin/permissions/menus/${menuId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '刪除失敗')
      }
      
      message.success('菜單刪除成功')
      fetchMenus()
    } catch (error: any) {
      console.error('刪除菜單失敗:', error)
      message.error(error.message || '刪除菜單失敗')
    }
  }

  // 更新權限矩陣
  const handleUpdatePermissionMatrix = async () => {
    try {
      const updates = []
      
      for (const roleId in permissionMatrix) {
        const menuIds = Object.keys(permissionMatrix[roleId])
          .filter(menuId => permissionMatrix[roleId][parseInt(menuId)])
          .map(menuId => parseInt(menuId))
        
        updates.push({
          roleId: parseInt(roleId),
          menuIds
        })
      }
      
      // 批量更新權限
      for (const update of updates) {
        const response = await fetch('/api/admin/permissions/menus', {
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
      fetchMenus()
    } catch (error: any) {
      console.error('更新權限矩陣失敗:', error)
      message.error(error.message || '更新權限矩陣失敗')
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
    
    // 轉換為Tree組件需要的數據格式
    const convertToTreeData = (nodes: (Menu & { children: Menu[] })[]): DataNode[] => {
      return nodes.map(node => ({
        key: node.id,
        title: (
          <div className="menu-tree-node group flex items-start justify-between w-full py-3 px-4 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300 border border-transparent hover:border-blue-200">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full text-white text-xs flex-shrink-0 ${
                node.children && node.children.length > 0 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                  : 'bg-gradient-to-r from-green-500 to-teal-600'
              }`}>
                {node.children && node.children.length > 0 ? (
                  <FolderOutlined />
                ) : (
                  <FileOutlined />
                )}
              </div>
                            <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-800 text-base">{node.displayName}</span>
                  {!node.isActive && (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      停用
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono text-xs">
                    {node.name}
                  </span>
                  {node.path && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                      路径: {node.path}
                    </span>
                  )}
                  {node.icon && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                      图标: {node.icon}
                    </span>
                  )}
                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">
                    排序: {node.sortOrder}
                  </span>
                  {node.rolePermissions && node.rolePermissions.length > 0 && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                      权限: {node.rolePermissions.length}个角色
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="menu-actions flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0">
              <Tooltip title="添加子菜單" placement="top">
                <Button
                  type="text"
                  size="small"
                  className="w-8 h-8 p-0 hover:bg-green-100 hover:text-green-600 rounded-lg hover:scale-105 transition-all"
                  icon={<PlusOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingMenu(null)
                    form.resetFields()
                    form.setFieldsValue({ parentId: node.id })
                    setModalVisible(true)
                  }}
                />
              </Tooltip>
              <Tooltip title="編輯菜單" placement="top">
                <Button
                  type="text"
                  size="small"
                  className="w-8 h-8 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-lg hover:scale-105 transition-all"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingMenu(node)
                    form.setFieldsValue({
                      ...node,
                      parentId: node.parentId || undefined
                    })
                    setModalVisible(true)
                  }}
                />
              </Tooltip>
              <Tooltip title="刪除菜單" placement="top">
                <Popconfirm
                  title="確定要刪除？"
                  description={`將刪除「${node.displayName}」${node.children?.length ? '及其所有子菜單' : ''}`}
                  onConfirm={(e) => {
                    e?.stopPropagation()
                    handleDeleteMenu(node.id)
                  }}
                  okText="刪除"
                  cancelText="取消"
                  placement="topRight"
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    className="w-8 h-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg hover:scale-105 transition-all"
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </Tooltip>
            </div>
          </div>
        ),
        children: node.children && node.children.length > 0 ? convertToTreeData(node.children as (Menu & { children: Menu[] })[]) : undefined
      }))
    }
    
    return convertToTreeData(roots)
  }

  // 獲取父菜單選項
  const getParentMenuOptions = (excludeId?: number): Menu[] => {
    const filterMenus = (menus: Menu[]): Menu[] => {
      return menus.filter(menu => {
        if (excludeId && menu.id === excludeId) return false
        return true
      })
    }
    
    return filterMenus(menus)
  }


  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="!mb-2">
            <MenuOutlined className="mr-2" />
            菜單權限管理
          </Title>
          <Text type="secondary">管理系統菜單結構和角色權限配置</Text>
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
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingMenu(null)
              form.resetFields()
              setModalVisible(true)
            }}
          >
            新增菜單
          </Button>
        </Space>
      </div>

      {/* 統計信息 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">總菜單數</Text>
                <div className="text-2xl font-bold text-blue-600">{menus.length}</div>
              </div>
              <MenuOutlined className="text-3xl text-blue-500" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">根菜單</Text>
                <div className="text-2xl font-bold text-green-600">
                  {menus.filter(m => !m.parentId).length}
                </div>
              </div>
              <FolderOutlined className="text-3xl text-green-500" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">啟用菜單</Text>
                <div className="text-2xl font-bold text-orange-600">
                  {menus.filter(m => m.isActive).length}
              </div>
            </div>
            <SettingOutlined className="text-3xl text-orange-500" />
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary">有子菜單的根菜單</Text>
              <div className="text-2xl font-bold text-purple-600">
                {menus.filter(m => !m.parentId && m.children && m.children.length > 0).length}
              </div>
            </div>
            <BranchesOutlined className="text-3xl text-purple-500" />
          </div>
        </Card>
      </Col>
    </Row>

      {/* 菜單管理主界面 */}
      <Row gutter={[16, 16]} className="min-h-0">
        <Col span={24}>
          <Card 
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <BranchesOutlined className="text-blue-500 text-lg" />
                  <span className="font-semibold text-lg">菜單樹結構</span>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                      共 {menus.length} 個菜單
                    </span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                      {menus.filter(m => !m.parentId).length} 個根菜單
                    </span>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                      {menus.filter(m => m.isActive).length} 個啟用
                    </span>
                  </div>
                </div>
                <Space size="middle">
                  <Button 
                    size="small" 
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => setExpandedKeys(menus.map(m => m.id))}
                    className="hover:bg-blue-50 px-3 py-1"
                  >
                    全部展開
                  </Button>
                  <Button 
                    size="small" 
                    type="text"
                    icon={<MinusOutlined />}
                    onClick={() => setExpandedKeys([])}
                    className="hover:bg-gray-50 px-3 py-1"
                  >
                    全部收起
                  </Button>
                  <Button 
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingMenu(null)
                      form.resetFields()
                      setModalVisible(true)
                    }}
                  >
                    新增菜單
                  </Button>
                </Space>
              </div>
            } 
            className="shadow-sm border-0"
            bodyStyle={{ padding: '20px' }}
          >
            <div className="h-[600px] overflow-auto bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-gray-200">
              <Tree
                treeData={buildMenuTree(menus)}
                expandedKeys={expandedKeys}
                onExpand={setExpandedKeys}
                showLine={{ showLeafIcon: false }}
                showIcon={false}
                className="menu-tree-expanded bg-transparent"
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 調試信息 */}
      <Card title="調試信息" className="mt-6">
        <div className="space-y-4">
          <div>
            <Text strong>菜單總數: {menus.length}</Text>
          </div>
          <div>
            <Text strong>財務系統菜單:</Text>
            <pre className="text-xs bg-gray-100 p-2 mt-2 rounded">
              {JSON.stringify(menus.find(m => m.name === 'financial'), null, 2)}
            </pre>
          </div>
          <div>
            <Text strong>財務系統子菜單數量:</Text>
            <div className="text-lg font-bold text-blue-600">
              {(() => {
                const financial = menus.find(m => m.name === 'financial');
                return financial?.children?.length || 0;
              })()}
            </div>
          </div>
          <div>
            <Text strong>銷控總表子菜單數量:</Text>
            <div className="text-lg font-bold text-green-600">
              {(() => {
                const salesControl = menus.find(m => m.name === 'sales-control-group');
                return salesControl?.children?.length || 0;
              })()}
            </div>
          </div>
          <div>
            <Text strong>有子菜單的根菜單:</Text>
            <div className="space-y-2">
              {menus
                .filter(m => !m.parentId && m.children && m.children.length > 0)
                .map(menu => (
                  <div key={menu.id} className="flex items-center space-x-2">
                    <span>📁 {menu.displayName}</span>
                    <span className="text-sm text-gray-500">({menu.children?.length} 個子菜單)</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 創建/編輯菜單模態框 */}
      <Modal
        title={editingMenu ? '編輯菜單' : '新增菜單'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingMenu(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveMenu}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="菜單標識"
                rules={[
                  { required: true, message: '請輸入菜單標識' },
                  { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '菜單標識格式不正確' }
                ]}
              >
                <Input placeholder="例如：user_management" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="displayName"
                label="顯示名稱"
                rules={[{ required: true, message: '請輸入顯示名稱' }]}
              >
                <Input placeholder="例如：用戶管理" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="path"
                label="菜單路徑"
              >
                <Input placeholder="例如：/admin/users" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="icon"
                label="圖標"
              >
                <Input placeholder="例如：UserOutlined" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="parentId"
                label="父菜單"
              >
                <Select
                  placeholder="選擇父菜單（可選）"
                  allowClear
                >
                  {getParentMenuOptions(editingMenu?.id).map(menu => (
                    <Option key={menu.id} value={menu.id}>
                      {menu.displayName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sortOrder"
                label="排序順序"
                initialValue={0}
              >
                <Input type="number" placeholder="數字越小越靠前" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="菜單描述"
          >
            <TextArea rows={3} placeholder="描述菜單的功能和用途" />
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
              {editingMenu ? '更新' : '創建'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 權限矩陣抽屜 */}
      <Drawer
        title="菜單權限矩陣"
        open={matrixDrawerVisible}
        onClose={() => setMatrixDrawerVisible(false)}
        width={800}
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
          message="權限矩陣配置"
          description="勾選表示該角色擁有對應菜單的訪問權限"
          type="info"
          showIcon
          className="mb-4"
        />
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left">菜單</th>
                {roles.map(role => (
                  <th key={role.id} className="border border-gray-300 p-2 text-center min-w-24">
                    <div className="text-xs">{role.displayName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {menus.map(menu => (
                <tr key={menu.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">
                    <div className="flex items-center space-x-2">
                      {menu.parentId ? (
                        <span className="ml-4 text-gray-400">└─</span>
                      ) : null}
                      <span className="font-medium">{menu.displayName}</span>
                      <Text type="secondary" className="text-xs">({menu.name})</Text>
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={role.id} className="border border-gray-300 p-2 text-center">
                      <Checkbox
                        checked={permissionMatrix[role.id]?.[menu.id] || false}
                        onChange={(e) => {
                          setPermissionMatrix(prev => ({
                            ...prev,
                            [role.id]: {
                              ...prev[role.id],
                              [menu.id]: e.target.checked
                            }
                          }))
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Drawer>
    </div>
  )
}