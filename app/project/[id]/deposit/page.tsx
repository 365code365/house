'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker, message, Popconfirm, Tag, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined, BellOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

interface DepositItem {
  id: number
  buyer: string
  amount: number
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE'
  paymentDate: string | null
  dueDate: string
  autoRemind: boolean
  remark: string
  houseNo: string
}

interface DepositFormData {
  buyer: string
  amount: number
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE'
  paymentDate: dayjs.Dayjs | null
  dueDate: dayjs.Dayjs
  autoRemind: boolean
  remark: string
  houseNo: string
}

export default function DepositPage() {
  const params = useParams()
  const projectId = params.id as string
  const [loading, setLoading] = useState(true)
  const [depositData, setDepositData] = useState<DepositItem[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<DepositItem | null>(null)
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
  const mockData: DepositItem[] = [
    {
      id: 1,
      buyer: '王小明',
      amount: 500000,
      paymentStatus: 'PAID',
      paymentDate: '2025/01/01',
      dueDate: '2025/01/15',
      autoRemind: true,
      remark: '已完成付款',
      houseNo: 'A1-101'
    },
    {
      id: 2,
      buyer: '李小華',
      amount: 300000,
      paymentStatus: 'PARTIAL',
      paymentDate: '2025/01/02',
      dueDate: '2025/01/20',
      autoRemind: true,
      remark: '已付部分款項',
      houseNo: 'A1-102'
    },
    {
      id: 3,
      buyer: '張大同',
      amount: 800000,
      paymentStatus: 'UNPAID',
      paymentDate: null,
      dueDate: '2025/02/01',
      autoRemind: true,
      remark: '尚未付款',
      houseNo: 'A1-103'
    },
    {
      id: 4,
      buyer: '陳美玲',
      amount: 600000,
      paymentStatus: 'OVERDUE',
      paymentDate: null,
      dueDate: '2024/12/31',
      autoRemind: true,
      remark: '逾期未付',
      houseNo: 'A1-104'
    },
    {
      id: 5,
      buyer: '林志明',
      amount: 450000,
      paymentStatus: 'PAID',
      paymentDate: '2025/01/05',
      dueDate: '2025/01/25',
      autoRemind: false,
      remark: '已完成付款，關閉提醒',
      houseNo: 'A1-105'
    }
  ]

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setDepositData(mockData)
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

  const handleEdit = (record: DepositItem) => {
    setEditingItem(record)
    form.setFieldsValue({
      buyer: record.buyer,
      amount: record.amount,
      paymentStatus: record.paymentStatus,
      paymentDate: record.paymentDate ? dayjs(record.paymentDate) : null,
      dueDate: dayjs(record.dueDate),
      autoRemind: record.autoRemind,
      remark: record.remark,
      houseNo: record.houseNo
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      setDepositData(prev => prev.filter(item => item.id !== id))
      message.success('刪除成功')
    } catch (error) {
      message.error('刪除失敗')
    }
  }

  const handleSubmit = async (values: DepositFormData) => {
    try {
      const paymentDate = values.paymentDate ? values.paymentDate.format('YYYY/MM/DD') : null
      const dueDate = values.dueDate.format('YYYY/MM/DD')

      if (editingItem) {
        // 编辑
        setDepositData(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { 
                ...item, 
                buyer: values.buyer,
                amount: values.amount,
                paymentStatus: values.paymentStatus,
                paymentDate,
                dueDate,
                autoRemind: values.autoRemind,
                remark: values.remark,
                houseNo: values.houseNo
              }
            : item
        ))
        message.success('更新成功')
      } else {
        // 新增
        const newItem: DepositItem = {
          id: Date.now(),
          buyer: values.buyer,
          amount: values.amount,
          paymentStatus: values.paymentStatus,
          paymentDate,
          dueDate,
          autoRemind: values.autoRemind,
          remark: values.remark,
          houseNo: values.houseNo
        }
        setDepositData(prev => [...prev, newItem])
        message.success('新增成功')
      }
      setIsModalVisible(false)
    } catch (error) {
      message.error('操作失敗')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'green'
      case 'PARTIAL': return 'blue'
      case 'UNPAID': return 'orange'
      case 'OVERDUE': return 'red'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return '已結清'
      case 'PARTIAL': return '部分付款'
      case 'UNPAID': return '未付款'
      case 'OVERDUE': return '逾期'
      default: return status
    }
  }

  const isOverdue = (dueDate: string, paymentStatus: string) => {
    return dayjs().isAfter(dayjs(dueDate)) && paymentStatus !== 'PAID'
  }

  const columns = [
    {
      title: '買方姓名',
      dataIndex: 'buyer',
      key: 'buyer',
      width: 120,
    },
    {
      title: '房型編號',
      dataIndex: 'houseNo',
      key: 'houseNo',
      width: 100,
    },
    {
      title: '訂金金額',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (value: number) => `${value.toLocaleString()} 元`,
      sorter: (a: DepositItem, b: DepositItem) => a.amount - b.amount,
    },
    {
      title: '付款狀態',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '已結清', value: 'PAID' },
        { text: '部分付款', value: 'PARTIAL' },
        { text: '未付款', value: 'UNPAID' },
        { text: '逾期', value: 'OVERDUE' },
      ],
      onFilter: (value: any, record: DepositItem) => record.paymentStatus === value,
    },
    {
      title: '付款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 100,
      render: (date: string | null) => date || '-',
      sorter: (a: DepositItem, b: DepositItem) => {
        if (!a.paymentDate && !b.paymentDate) return 0
        if (!a.paymentDate) return 1
        if (!b.paymentDate) return -1
        return dayjs(a.paymentDate).unix() - dayjs(b.paymentDate).unix()
      },
    },
    {
      title: '付款到期日',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 100,
      render: (date: string, record: DepositItem) => (
        <span style={{ 
          color: isOverdue(date, record.paymentStatus) ? '#ff4d4f' : 'inherit',
          fontWeight: isOverdue(date, record.paymentStatus) ? 'bold' : 'normal'
        }}>
          {date}
          {isOverdue(date, record.paymentStatus) && ' ⚠️'}
        </span>
      ),
      sorter: (a: DepositItem, b: DepositItem) => 
        dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix(),
    },
    {
      title: '自動提醒',
      dataIndex: 'autoRemind',
      key: 'autoRemind',
      width: 100,
      render: (autoRemind: boolean, record: DepositItem) => (
        <Switch
          checked={autoRemind}
          size="small"
          onChange={(checked) => {
            setDepositData(prev => prev.map(item => 
              item.id === record.id ? { ...item, autoRemind: checked } : item
            ))
            message.success(`已${checked ? '開啟' : '關閉'}自動提醒`)
          }}
        />
      ),
    },
    {
      title: '備註',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: DepositItem) => (
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
            title="確定要刪除這個訂金記錄嗎？"
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

  // 统计数据
  const stats = {
    total: depositData.length,
    paid: depositData.filter(item => item.paymentStatus === 'PAID').length,
    unpaid: depositData.filter(item => item.paymentStatus === 'UNPAID').length,
    overdue: depositData.filter(item => item.paymentStatus === 'OVERDUE').length,
    totalAmount: depositData.reduce((sum, item) => sum + item.amount, 0),
    paidAmount: depositData.filter(item => item.paymentStatus === 'PAID').reduce((sum, item) => sum + item.amount, 0)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">訂金管理</h1>
        <p className="text-gray-600">數據來源為銷控表中的訂金管理</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500">總訂金筆數</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-sm text-gray-500">已結清筆數</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.unpaid}</div>
            <div className="text-sm text-gray-500">未付款筆數</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-gray-500">逾期筆數</div>
          </div>
        </Card>
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
            新增訂金記錄
          </Button>
          <Button icon={<BellOutlined />}>
            發送提醒
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
          dataSource={depositData}
          loading={loading}
          rowKey="id"
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
          rowClassName={(record) => 
            isOverdue(record.dueDate, record.paymentStatus) ? 'bg-red-50' : ''
          }
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingItem ? '編輯訂金記錄' : '新增訂金記錄'}
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
            name="buyer"
            label="買方姓名"
            rules={[{ required: true, message: '請輸入買方姓名' }]}
          >
            <Input placeholder="請輸入買方姓名" />
          </Form.Item>

          <Form.Item
            name="houseNo"
            label="房型編號"
            rules={[{ required: true, message: '請輸入房型編號' }]}
          >
            <Input placeholder="請輸入房型編號" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="訂金金額"
            rules={[{ required: true, message: '請輸入訂金金額' }]}
          >
            <InputNumber
              placeholder="請輸入訂金金額"
              style={{ width: '100%' }}
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item
            name="paymentStatus"
            label="付款狀態"
            rules={[{ required: true, message: '請選擇付款狀態' }]}
          >
            <Select placeholder="請選擇付款狀態">
              <Option value="PAID">已結清</Option>
              <Option value="PARTIAL">部分付款</Option>
              <Option value="UNPAID">未付款</Option>
              <Option value="OVERDUE">逾期</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="paymentDate"
            label="付款日期"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY/MM/DD"
              placeholder="請選擇付款日期"
            />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="付款到期日"
            rules={[{ required: true, message: '請選擇付款到期日' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY/MM/DD"
              placeholder="請選擇付款到期日"
            />
          </Form.Item>

          <Form.Item
            name="autoRemind"
            label="自動提醒"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="remark"
            label="備註"
          >
            <Input.TextArea placeholder="請輸入備註" rows={3} />
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