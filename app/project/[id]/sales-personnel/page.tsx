"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Select,
  Typography,
  Space,
  message,
  Popconfirm,
  Badge,
  Card,
  Row,
  Col,
  Divider
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

interface SalesPersonnel {
  id: number
  employee_no: string
  name: string
  email: string
  phone: string
  project_ids: string
  remark: string
  createdAt: string
  updatedAt: string
  // 統計資訊
  total_sales?: number
  total_amount?: number
  current_month_sales?: number
}

interface SalesPersonnelFormData {
  employee_no: string
  name: string
  email: string
  password?: string
  phone: string
  project_ids: string[]
  remark: string
}

export default function SalesPersonnelPage() {
  const params = useParams()
  const projectId = params.id as string
  const [data, setData] = useState<SalesPersonnel[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SalesPersonnel | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [form] = Form.useForm<SalesPersonnelFormData>()

  // 獲取銷售人員資料
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/sales-personnel`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        message.error('獲取銷售人員資料失敗')
      }
    } catch (error) {
      console.error('獲取銷售人員資料失敗:', error)
      message.error('獲取銷售人員資料失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  // 新增銷售人員
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  // 編輯銷售人員
  const handleEdit = (record: SalesPersonnel) => {
    setEditingRecord(record)
    form.setFieldsValue({
      employee_no: record.employee_no,
      name: record.name,
      email: record.email,
      phone: record.phone,
      project_ids: record.project_ids ? record.project_ids.split(',') : [],
      remark: record.remark
    })
    setIsModalOpen(true)
  }

  // 刪除銷售人員
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sales-personnel/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        message.success('刪除成功')
        fetchData()
      } else {
        message.error('刪除失敗')
      }
    } catch (error) {
      console.error('刪除失敗:', error)
      message.error('刪除失敗')
    }
  }

  // 儲存銷售人員
  const handleSave = async (values: SalesPersonnelFormData) => {
    try {
      const url = editingRecord
        ? `/api/projects/${projectId}/sales-personnel/${editingRecord.id}`
        : `/api/projects/${projectId}/sales-personnel`
      
      const method = editingRecord ? 'PUT' : 'POST'
      
      const requestData = {
        ...values,
        project_ids: values.project_ids.join(',')
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        message.success(editingRecord ? '更新成功' : '新增成功')
        setIsModalOpen(false)
        fetchData()
      } else {
        const error = await response.json()
        message.error(error.message || '操作失敗')
      }
    } catch (error) {
      console.error('儲存失敗:', error)
      message.error('儲存失敗')
    }
  }

  // 匯出功能
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const url = `/api/projects/${projectId}/sales-personnel/export?format=${format}`
    window.open(url, '_blank')
  }

  // 篩選資料
  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employee_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      title: '員工編號',
      dataIndex: 'employee_no',
      key: 'employee_no',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '信箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '電話',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '負責建案',
      dataIndex: 'project_ids',
      key: 'project_ids',
      width: 120,
      render: (projectIds: string) => {
        if (!projectIds) return '-'
        const count = projectIds.split(',').length
        return <Badge count={count} showZero color="blue" />
      }
    },
    {
      title: '總銷售額',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount: number) => amount ? `${amount.toLocaleString()} 萬元` : '-'
    },
    {
      title: '銷售套數',
      dataIndex: 'total_sales',
      key: 'total_sales',
      width: 100,
      render: (sales: number) => sales ? `${sales} 套` : '0 套'
    },
    {
      title: '本月銷售',
      dataIndex: 'current_month_sales',
      key: 'current_month_sales',
      width: 100,
      render: (sales: number) => sales ? `${sales} 套` : '0 套'
    },
    {
      title: '備註',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (remark: string) => remark || '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: SalesPersonnel) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            編輯
          </Button>
          <Popconfirm
            title="確定要刪除這個銷售人員嗎？"
            description="刪除後將無法復原，請謹慎操作。"
            onConfirm={() => handleDelete(record.id)}
            okText="確定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              刪除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '0' }}>
      {/* 頁面標題和統計卡片 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Title level={2}>銷售人員管理</Title>
            <Text type="secondary">管理銷售團隊資訊與權限設定</Text>
          </div>
        </div>
        
        {/* 統計卡片 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <UserOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
                <div>
                  <Text type="secondary">總人數</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                    {data.length}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: '24px', color: '#52c41a', marginRight: '12px' }}>💰</div>
                <div>
                  <Text type="secondary">總銷售額</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {data.reduce((sum, item) => sum + (item.total_amount || 0), 0).toLocaleString()} 萬
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: '24px', color: '#fa8c16', marginRight: '12px' }}>🏠</div>
                <div>
                  <Text type="secondary">總銷售套數</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                    {data.reduce((sum, item) => sum + (item.total_sales || 0), 0)} 套
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: '24px', color: '#eb2f96', marginRight: '12px' }}>📈</div>
                <div>
                  <Text type="secondary">本月銷售</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#eb2f96' }}>
                    {data.reduce((sum, item) => sum + (item.current_month_sales || 0), 0)} 套
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 操作欄 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增銷售人員
            </Button>
          </Space>
        </Col>
        
        <Col>
          <Space>
            <Input
              placeholder="搜尋姓名、員工編號或信箱..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExport('csv')}
            >
              匯出CSV
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => handleExport('excel')}
            >
              匯出Excel
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => handleExport('pdf')}
            >
              匯出PDF
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 資料表格 */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        pagination={{
          total: filteredData.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 筆，共 ${total} 筆記錄`
        }}
        scroll={{ x: 1200 }}
      />

      {/* 新增/編輯對話框 */}
      <Modal
        title={editingRecord ? '編輯銷售人員' : '新增銷售人員'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="員工編號"
                name="employee_no"
                rules={[
                  { required: true, message: '請輸入員工編號' },
                  { pattern: /^[A-Za-z0-9]+$/, message: '員工編號只能包含字母和數字' }
                ]}
              >
                <Input placeholder="請輸入員工編號" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '請輸入姓名' }]}
              >
                <Input placeholder="請輸入姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="信箱"
                name="email"
                rules={[
                  { required: true, message: '請輸入信箱' },
                  { type: 'email', message: '請輸入有效的信箱地址' }
                ]}
              >
                <Input placeholder="請輸入信箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="電話"
                name="phone"
                rules={[
                  { pattern: /^09\d{8}$/, message: '請輸入有效的手機號碼（09xxxxxxxxx）' }
                ]}
              >
                <Input placeholder="請輸入電話號碼" />
              </Form.Item>
            </Col>
          </Row>

          {!editingRecord && (
            <Form.Item
              label="登入密碼"
              name="password"
              rules={[
                { required: true, message: '請輸入登入密碼' },
                { min: 6, message: '密碼至少6位字元' }
              ]}
            >
              <Input.Password placeholder="請輸入登入密碼" />
            </Form.Item>
          )}

          <Form.Item
            label="負責建案"
            name="project_ids"
            rules={[{ required: true, message: '請選擇負責的建案' }]}
          >
            <Select
              mode="multiple"
              placeholder="請選擇負責的建案"
              style={{ width: '100%' }}
            >
              <Option value={projectId}>目前建案</Option>
              {/* TODO: 從API獲取其他建案列表 */}
            </Select>
          </Form.Item>

          <Form.Item
            label="備註"
            name="remark"
          >
            <TextArea
              rows={3}
              placeholder="請輸入備註資訊"
            />
          </Form.Item>

          <Divider />
          
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '更新' : '新增'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  )
}