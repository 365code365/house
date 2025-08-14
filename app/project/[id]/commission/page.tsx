'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker, message, Popconfirm, Tag, Progress } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { formatCurrency } from '@/lib/utils'

const { Option } = Select
const { RangePicker } = DatePicker

interface CommissionItem {
  id: number
  building: string
  area: number
  unit: string
  status: 'SOLD' | 'DEPOSIT'
  salesId: string
  salesName: string
  salesDate: string
  totalPrice: number
  totalCommissionRate: number
  totalCommission: number
  commissionDetails: CommissionDetail[]
}

interface CommissionDetail {
  id: number
  commissionNo: number
  rate: number
  status: 'COMMISSIONED' | 'NOT_COMMISSIONED'
  amount: number
  remark: string
}

interface CommissionFormData {
  building: string
  area: number
  unit: string
  status: 'SOLD' | 'DEPOSIT'
  salesId: string
  salesDate: dayjs.Dayjs
  totalPrice: number
  totalCommissionRate: number
}

export default function CommissionPage() {
  const params = useParams()
  const projectId = params.id as string
  const [loading, setLoading] = useState(true)
  const [commissionData, setCommissionData] = useState<CommissionItem[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<CommissionItem | null>(null)
  const [form] = Form.useForm()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(11, 'month').startOf('month'),
    dayjs().endOf('month')
  ])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // 模拟数据
  const mockData: CommissionItem[] = [
    {
      id: 1,
      building: 'A',
      area: 27.5,
      unit: 'A1',
      status: 'SOLD',
      salesId: 'S001',
      salesName: '張業務',
      salesDate: '2025/01/01',
      totalPrice: 910500600,
      totalCommissionRate: 3.0,
      totalCommission: 27315018,
      commissionDetails: [
        {
          id: 1,
          commissionNo: 1,
          rate: 1.5,
          status: 'COMMISSIONED',
          amount: 13657509,
          remark: '第一次請佣'
        },
        {
          id: 2,
          commissionNo: 2,
          rate: 1.5,
          status: 'NOT_COMMISSIONED',
          amount: 13657509,
          remark: '第二次請佣'
        }
      ]
    },
    {
      id: 2,
      building: 'A',
      area: 28.2,
      unit: 'A2',
      status: 'DEPOSIT',
      salesId: 'S002',
      salesName: '李業務',
      salesDate: '2025/01/02',
      totalPrice: 500600,
      totalCommissionRate: 2.5,
      totalCommission: 12515,
      commissionDetails: [
        {
          id: 3,
          commissionNo: 1,
          rate: 2.5,
          status: 'NOT_COMMISSIONED',
          amount: 12515,
          remark: '訂金請佣'
        }
      ]
    },
    {
      id: 3,
      building: 'A',
      area: 30.1,
      unit: 'A3',
      status: 'SOLD',
      salesId: 'S001',
      salesName: '張業務',
      salesDate: '2025/01/03',
      totalPrice: 666666000,
      totalCommissionRate: 3.0,
      totalCommission: 19999980,
      commissionDetails: [
        {
          id: 4,
          commissionNo: 1,
          rate: 1.5,
          status: 'COMMISSIONED',
          amount: 9999990,
          remark: '第一次請佣'
        },
        {
          id: 5,
          commissionNo: 2,
          rate: 1.5,
          status: 'COMMISSIONED',
          amount: 9999990,
          remark: '第二次請佣'
        }
      ]
    }
  ]

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setCommissionData(mockData)
      setPagination(prev => ({ ...prev, total: mockData.length }))
      setLoading(false)
    }, 1000)
  }, [projectId, pagination.page, pagination.pageSize])

  const handlePaginationChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      page,
      pageSize: pageSize || prev.pageSize
    }))
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (record: CommissionItem) => {
    setEditingItem(record)
    form.setFieldsValue({
      building: record.building,
      area: record.area,
      unit: record.unit,
      status: record.status,
      salesId: record.salesId,
      salesDate: dayjs(record.salesDate),
      totalPrice: record.totalPrice,
      totalCommissionRate: record.totalCommissionRate
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      setCommissionData(prev => prev.filter(item => item.id !== id))
      message.success('刪除成功')
    } catch (error) {
      message.error('刪除失敗')
    }
  }

  const handleSubmit = async (values: CommissionFormData) => {
    try {
      const totalCommission = (values.totalPrice * values.totalCommissionRate) / 100
      const salesDate = values.salesDate.format('YYYY/MM/DD')

      if (editingItem) {
        // 编辑
        setCommissionData(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { 
                ...item, 
                building: values.building,
                area: values.area,
                unit: values.unit,
                status: values.status,
                salesId: values.salesId,
                salesName: '業務員', // 这里应该从API获取
                salesDate,
                totalPrice: values.totalPrice,
                totalCommissionRate: values.totalCommissionRate,
                totalCommission
              }
            : item
        ))
        message.success('更新成功')
      } else {
        // 新增
        const newItem: CommissionItem = {
          id: Date.now(),
          building: values.building,
          area: values.area,
          unit: values.unit,
          status: values.status,
          salesId: values.salesId,
          salesName: '業務員', // 这里应该从API获取
          salesDate,
          totalPrice: values.totalPrice,
          totalCommissionRate: values.totalCommissionRate,
          totalCommission,
          commissionDetails: []
        }
        setCommissionData(prev => [...prev, newItem])
        message.success('新增成功')
      }
      setIsModalVisible(false)
    } catch (error) {
      message.error('操作失敗')
    }
  }

  const getCommissionProgress = (details: CommissionDetail[]) => {
    const commissioned = details.filter(d => d.status === 'COMMISSIONED').length
    const total = details.length
    return total > 0 ? (commissioned / total) * 100 : 0
  }

  const expandedRowRender = (record: CommissionItem) => {
    const columns = [
      {
        title: '請佣次數',
        dataIndex: 'commissionNo',
        key: 'commissionNo',
        render: (value: number) => `第${value}次`,
      },
      {
        title: '佣金比例',
        dataIndex: 'rate',
        key: 'rate',
        render: (value: number) => `${value}%`,
      },
      {
        title: '請佣金額',
        dataIndex: 'amount',
        key: 'amount',
        render: (value: number) => formatCurrency(value),
      },
      {
        title: '請佣狀態',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={status === 'COMMISSIONED' ? 'green' : 'orange'}>
            {status === 'COMMISSIONED' ? '已請佣' : '未請佣'}
          </Tag>
        ),
      },
      {
        title: '備註',
        dataIndex: 'remark',
        key: 'remark',
      },
    ]

    return (
      <Table
        columns={columns}
        dataSource={record.commissionDetails}
        pagination={false}
        size="small"
        rowKey="id"
      />
    )
  }

  const columns = [
    {
      title: '棟別',
      dataIndex: 'building',
      key: 'building',
      width: 80,
    },
    {
      title: '坪數',
      dataIndex: 'area',
      key: 'area',
      width: 80,
      render: (value: number) => `${value}坪`,
    },
    {
      title: '戶別',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'SOLD' ? 'green' : 'blue'}>
          {status === 'SOLD' ? '售出' : '訂金'}
        </Tag>
      ),
      filters: [
        { text: '售出', value: 'SOLD' },
        { text: '訂金', value: 'DEPOSIT' },
      ],
      onFilter: (value: any, record: CommissionItem) => record.status === value,
    },
    {
      title: '銷售員',
      dataIndex: 'salesName',
      key: 'salesName',
      width: 100,
    },
    {
      title: '銷售日期',
      dataIndex: 'salesDate',
      key: 'salesDate',
      width: 100,
      sorter: (a: CommissionItem, b: CommissionItem) => 
        dayjs(a.salesDate).unix() - dayjs(b.salesDate).unix(),
    },
    {
      title: '房屋總價',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      render: (value: number) => `${formatCurrency(value / 10000)} 萬`,
      sorter: (a: CommissionItem, b: CommissionItem) => a.totalPrice - b.totalPrice,
    },
    {
      title: '總請佣比例',
      dataIndex: 'totalCommissionRate',
      key: 'totalCommissionRate',
      width: 100,
      render: (value: number) => `${value}%`,
    },
    {
      title: '總請佣金額',
      dataIndex: 'totalCommission',
      key: 'totalCommission',
      width: 120,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '請佣進度',
      key: 'progress',
      width: 120,
      render: (_: any, record: CommissionItem) => {
        const progress = getCommissionProgress(record.commissionDetails)
        return (
          <Progress
            percent={progress}
            size="small"
            status={progress === 100 ? 'success' : 'active'}
          />
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: CommissionItem) => (
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
            title="確定要刪除這個請佣記錄嗎？"
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
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">請佣列表</h1>
        <p className="text-gray-600">數據來源為銷控表中已售出的戶型</p>
      </div>

      {/* 工具栏 */}
      <div className="mb-6">
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            format="YYYY/MM/DD"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增請佣記錄
          </Button>
          <Button icon={<ExportOutlined />}>
            匯出
          </Button>
        </Space>
      </div>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={commissionData}
          loading={loading}
          rowKey="id"
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => record.commissionDetails.length > 0,
          }}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: handlePaginationChange,
            onShowSizeChange: handlePaginationChange
          }}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingItem ? '編輯請佣記錄' : '新增請佣記錄'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="building"
            label="棟別"
            rules={[{ required: true, message: '請輸入棟別' }]}
          >
            <Input placeholder="請輸入棟別" />
          </Form.Item>

          <Form.Item
            name="area"
            label="坪數"
            rules={[{ required: true, message: '請輸入坪數' }]}
          >
            <InputNumber
              placeholder="請輸入坪數"
              style={{ width: '100%' }}
              min={0}
              step={0.1}
            />
          </Form.Item>

          <Form.Item
            name="unit"
            label="戶別"
            rules={[{ required: true, message: '請輸入戶別' }]}
          >
            <Input placeholder="請輸入戶別" />
          </Form.Item>

          <Form.Item
            name="status"
            label="請佣狀態"
            rules={[{ required: true, message: '請選擇請佣狀態' }]}
          >
            <Select placeholder="請選擇請佣狀態">
              <Option value="SOLD">售出</Option>
              <Option value="DEPOSIT">訂金</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="salesId"
            label="銷售員編號"
            rules={[{ required: true, message: '請輸入銷售員編號' }]}
          >
            <Input placeholder="請輸入銷售員編號" />
          </Form.Item>

          <Form.Item
            name="salesDate"
            label="銷售日期"
            rules={[{ required: true, message: '請選擇銷售日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY/MM/DD"
              placeholder="請選擇銷售日期"
            />
          </Form.Item>

          <Form.Item
            name="totalPrice"
            label="房屋總價"
            rules={[{ required: true, message: '請輸入房屋總價' }]}
          >
            <InputNumber
              placeholder="請輸入房屋總價"
              style={{ width: '100%' }}
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item
            name="totalCommissionRate"
            label="總請佣比例 (%)"
            rules={[{ required: true, message: '請輸入總請佣比例' }]}
          >
            <InputNumber
              placeholder="請輸入總請佣比例"
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={0.1}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? '更新' : '新增'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}