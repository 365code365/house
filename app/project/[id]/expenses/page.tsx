'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker, message, Popconfirm, Drawer } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { formatCurrency } from '@/lib/utils'

const { Option } = Select
const { RangePicker } = DatePicker

interface ExpenseItem {
  id: number
  expenseDate: string
  category: string
  item: string
  actualExpense: number
  quantity: number
  unit: string
  unitPrice: number
  vendor: string
  invoiceNo: string
  remark: string
}

interface ExpenseFormData {
  expenseDate: dayjs.Dayjs
  category: string
  item: string
  quantity: number
  unit: string
  unitPrice: number
  vendor: string
  invoiceNo: string
  remark: string
}

export default function ExpensesPage() {
  const params = useParams()
  const projectId = params.id as string
  const [loading, setLoading] = useState(true)
  const [expenseData, setExpenseData] = useState<ExpenseItem[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isDrawerVisible, setIsDrawerVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null)
  const [viewingItem, setViewingItem] = useState<ExpenseItem | null>(null)
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
  const mockData: ExpenseItem[] = [
    {
      id: 1,
      expenseDate: '2025/01/01',
      category: '網路廣告',
      item: '主題廣告',
      actualExpense: 600000,
      quantity: 1,
      unit: '式',
      unitPrice: 600000,
      vendor: '廣告代理商',
      invoiceNo: 'INV-2025-001',
      remark: '主要推廣活動'
    },
    {
      id: 2,
      expenseDate: '2025/01/02',
      category: '平面印刷',
      item: '宣傳單張',
      actualExpense: 25000,
      quantity: 1,
      unit: '式',
      unitPrice: 25000,
      vendor: '印刷廠商',
      invoiceNo: 'INV-2025-002',
      remark: '宣傳用途'
    },
    {
      id: 3,
      expenseDate: '2025/01/03',
      category: '戶外廣告',
      item: '看板廣告',
      actualExpense: 6000,
      quantity: 2,
      unit: '面',
      unitPrice: 3000,
      vendor: '戶外廣告商',
      invoiceNo: 'INV-2025-003',
      remark: '主要路段展示'
    },
    {
      id: 4,
      expenseDate: '2025/01/04',
      category: '業務推廣',
      item: '推廣活動',
      actualExpense: 99750,
      quantity: 1,
      unit: '式',
      unitPrice: 99750,
      vendor: '活動公司',
      invoiceNo: 'INV-2025-004',
      remark: '開盤活動'
    },
    {
      id: 5,
      expenseDate: '2025/01/05',
      category: '人員薪資',
      item: '銷售人員',
      actualExpense: 25000,
      quantity: 1,
      unit: '月',
      unitPrice: 25000,
      vendor: '內部',
      invoiceNo: 'PAY-2025-001',
      remark: '銷售團隊薪資'
    },
    {
      id: 6,
      expenseDate: '2025/01/06',
      category: '其他支出',
      item: '雜項費用',
      actualExpense: 20000,
      quantity: 1,
      unit: '式',
      unitPrice: 20000,
      vendor: '各廠商',
      invoiceNo: 'MISC-2025-001',
      remark: '其他必要支出'
    }
  ]

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setExpenseData(mockData)
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

  const handleEdit = (record: ExpenseItem) => {
    setEditingItem(record)
    form.setFieldsValue({
      expenseDate: dayjs(record.expenseDate),
      category: record.category,
      item: record.item,
      quantity: record.quantity,
      unit: record.unit,
      unitPrice: record.unitPrice,
      vendor: record.vendor,
      invoiceNo: record.invoiceNo,
      remark: record.remark
    })
    setIsModalVisible(true)
  }

  const handleView = (record: ExpenseItem) => {
    setViewingItem(record)
    setIsDrawerVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      setExpenseData(prev => prev.filter(item => item.id !== id))
      message.success('刪除成功')
    } catch (error) {
      message.error('刪除失敗')
    }
  }

  const handleSubmit = async (values: ExpenseFormData) => {
    try {
      const actualExpense = values.quantity * values.unitPrice
      const expenseDate = values.expenseDate.format('YYYY/MM/DD')

      if (editingItem) {
        // 编辑
        setExpenseData(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { 
                ...item, 
                expenseDate,
                category: values.category,
                item: values.item,
                actualExpense,
                quantity: values.quantity,
                unit: values.unit,
                unitPrice: values.unitPrice,
                vendor: values.vendor,
                invoiceNo: values.invoiceNo,
                remark: values.remark
              }
            : item
        ))
        message.success('更新成功')
      } else {
        // 新增
        const newItem: ExpenseItem = {
          id: Date.now(),
          expenseDate,
          category: values.category,
          item: values.item,
          actualExpense,
          quantity: values.quantity,
          unit: values.unit,
          unitPrice: values.unitPrice,
          vendor: values.vendor,
          invoiceNo: values.invoiceNo,
          remark: values.remark
        }
        setExpenseData(prev => [...prev, newItem])
        message.success('新增成功')
      }
      setIsModalVisible(false)
    } catch (error) {
      message.error('操作失敗')
    }
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      width: 100,
      sorter: (a: ExpenseItem, b: ExpenseItem) => 
        dayjs(a.expenseDate).unix() - dayjs(b.expenseDate).unix(),
    },
    {
      title: '類別',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      filters: [
        { text: '網路廣告', value: '網路廣告' },
        { text: '平面印刷', value: '平面印刷' },
        { text: '戶外廣告', value: '戶外廣告' },
        { text: '業務推廣', value: '業務推廣' },
        { text: '人員薪資', value: '人員薪資' },
        { text: '其他支出', value: '其他支出' },
      ],
      onFilter: (value: any, record: ExpenseItem) => record.category === value,
    },
    {
      title: '細項',
      dataIndex: 'item',
      key: 'item',
      width: 120,
    },
    {
      title: '實際支出',
      dataIndex: 'actualExpense',
      key: 'actualExpense',
      width: 100,
      render: (value: number) => formatCurrency(value),
      sorter: (a: ExpenseItem, b: ExpenseItem) => a.actualExpense - b.actualExpense,
    },
    {
      title: '數量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '單位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '單價',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '廠商',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 120,
    },
    {
      title: '發票號碼',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ExpenseItem) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            size="small"
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            編輯
          </Button>
          <Popconfirm
            title="確定要刪除這個支出記錄嗎？"
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
        <h1 className="text-2xl font-bold mb-2">支出管理</h1>
        <p className="text-gray-600">須具備時間過濾：新增預算功能</p>
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
            新增支出記錄
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
          dataSource={expenseData}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1400 }}
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
        title={editingItem ? '編輯支出記錄' : '新增支出記錄'}
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
            name="expenseDate"
            label="支出日期"
            rules={[{ required: true, message: '請選擇支出日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY/MM/DD"
              placeholder="請選擇支出日期"
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="類別"
            rules={[{ required: true, message: '請選擇類別' }]}
          >
            <Select placeholder="請選擇類別">
              <Option value="網路廣告">網路廣告</Option>
              <Option value="平面印刷">平面印刷</Option>
              <Option value="戶外廣告">戶外廣告</Option>
              <Option value="業務推廣">業務推廣</Option>
              <Option value="人員薪資">人員薪資</Option>
              <Option value="其他支出">其他支出</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="item"
            label="細項"
            rules={[{ required: true, message: '請輸入細項' }]}
          >
            <Input placeholder="請輸入細項" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="數量"
            rules={[{ required: true, message: '請輸入數量' }]}
          >
            <InputNumber
              placeholder="請輸入數量"
              style={{ width: '100%' }}
              min={1}
            />
          </Form.Item>

          <Form.Item
            name="unit"
            label="單位"
            rules={[{ required: true, message: '請輸入單位' }]}
          >
            <Input placeholder="請輸入單位" />
          </Form.Item>

          <Form.Item
            name="unitPrice"
            label="單價"
            rules={[{ required: true, message: '請輸入單價' }]}
          >
            <InputNumber
              placeholder="請輸入單價"
              style={{ width: '100%' }}
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item
            name="vendor"
            label="廠商"
            rules={[{ required: true, message: '請輸入廠商' }]}
          >
            <Input placeholder="請輸入廠商" />
          </Form.Item>

          <Form.Item
            name="invoiceNo"
            label="發票號碼"
            rules={[{ required: true, message: '請輸入發票號碼' }]}
          >
            <Input placeholder="請輸入發票號碼" />
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

      {/* 查看详情抽屉 */}
      <Drawer
        title="支出記錄詳情"
        placement="right"
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        width={400}
      >
        {viewingItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支出日期</label>
              <div className="text-sm text-gray-900">{viewingItem.expenseDate}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">類別</label>
              <div className="text-sm text-gray-900">{viewingItem.category}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">細項</label>
              <div className="text-sm text-gray-900">{viewingItem.item}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">實際支出</label>
              <div className="text-sm text-gray-900">{formatCurrency(viewingItem.actualExpense)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">數量</label>
              <div className="text-sm text-gray-900">{viewingItem.quantity}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">單位</label>
              <div className="text-sm text-gray-900">{viewingItem.unit}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">單價</label>
              <div className="text-sm text-gray-900">{formatCurrency(viewingItem.unitPrice)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">廠商</label>
              <div className="text-sm text-gray-900">{viewingItem.vendor}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">發票號碼</label>
              <div className="text-sm text-gray-900">{viewingItem.invoiceNo}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
              <div className="text-sm text-gray-900">{viewingItem.remark || '無'}</div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}