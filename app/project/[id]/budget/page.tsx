'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

interface BudgetItem {
  id: number
  category: string
  item: string
  budget: number
  actualExpense: number
  quantity: number
  unit: string
  unitPrice: number
  vendor: string
  executionRate: number
  remark: string
}

interface BudgetFormData {
  category: string
  item: string
  budget: number
  quantity: number
  unit: string
  unitPrice: number
  vendor: string
  remark: string
}

export default function BudgetPage() {
  const params = useParams()
  const projectId = params.id as string
  const [loading, setLoading] = useState(true)
  const [budgetData, setBudgetData] = useState<BudgetItem[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)
  const [form] = Form.useForm()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(11, 'month').startOf('month'),
    dayjs().endOf('month')
  ])

  // 模拟数据
  const mockData: BudgetItem[] = [
    {
      id: 1,
      category: '網路廣告',
      item: '主題廣告',
      budget: 600000,
      actualExpense: 600000,
      quantity: 1,
      unit: '式',
      unitPrice: 600000,
      vendor: '廣告代理商',
      executionRate: 100,
      remark: '主要推廣活動'
    },
    {
      id: 2,
      category: '平面印刷',
      item: '宣傳單張',
      budget: 25000,
      actualExpense: 25000,
      quantity: 1,
      unit: '式',
      unitPrice: 25000,
      vendor: '印刷廠商',
      executionRate: 100,
      remark: '宣傳用途'
    },
    {
      id: 3,
      category: '戶外廣告',
      item: '看板廣告',
      budget: 8000,
      actualExpense: 6000,
      quantity: 2,
      unit: '面',
      unitPrice: 3000,
      vendor: '戶外廣告商',
      executionRate: 75,
      remark: '主要路段展示'
    },
    {
      id: 4,
      category: '業務推廣',
      item: '推廣活動',
      budget: 99750,
      actualExpense: 99750,
      quantity: 1,
      unit: '式',
      unitPrice: 99750,
      vendor: '活動公司',
      executionRate: 100,
      remark: '開盤活動'
    },
    {
      id: 5,
      category: '人員薪資',
      item: '銷售人員',
      budget: 25000,
      actualExpense: 25000,
      quantity: 1,
      unit: '月',
      unitPrice: 25000,
      vendor: '內部',
      executionRate: 100,
      remark: '銷售團隊薪資'
    },
    {
      id: 6,
      category: '其他支出',
      item: '雜項費用',
      budget: 25000,
      actualExpense: 20000,
      quantity: 1,
      unit: '式',
      unitPrice: 20000,
      vendor: '各廠商',
      executionRate: 80,
      remark: '其他必要支出'
    }
  ]

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setBudgetData(mockData)
      setLoading(false)
    }, 1000)
  }, [projectId])

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (record: BudgetItem) => {
    setEditingItem(record)
    form.setFieldsValue({
      category: record.category,
      item: record.item,
      budget: record.budget,
      quantity: record.quantity,
      unit: record.unit,
      unitPrice: record.unitPrice,
      vendor: record.vendor,
      remark: record.remark
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      setBudgetData(prev => prev.filter(item => item.id !== id))
      message.success('刪除成功')
    } catch (error) {
      message.error('刪除失敗')
    }
  }

  const handleSubmit = async (values: BudgetFormData) => {
    try {
      const actualExpense = values.quantity * values.unitPrice
      const executionRate = (actualExpense / values.budget) * 100

      if (editingItem) {
        // 编辑
        setBudgetData(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { 
                ...item, 
                ...values, 
                actualExpense,
                executionRate
              }
            : item
        ))
        message.success('更新成功')
      } else {
        // 新增
        const newItem: BudgetItem = {
          id: Date.now(),
          ...values,
          actualExpense,
          executionRate
        }
        setBudgetData(prev => [...prev, newItem])
        message.success('新增成功')
      }
      setIsModalVisible(false)
    } catch (error) {
      message.error('操作失敗')
    }
  }

  const columns = [
    {
      title: '類別',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '細項',
      dataIndex: 'item',
      key: 'item',
      width: 120,
    },
    {
      title: '預算',
      dataIndex: 'budget',
      key: 'budget',
      width: 100,
      render: (value: number) => `${value.toLocaleString()}`,
    },
    {
      title: '實際支出',
      dataIndex: 'actualExpense',
      key: 'actualExpense',
      width: 100,
      render: (value: number) => `${value.toLocaleString()}`,
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
      render: (value: number) => `${value.toLocaleString()}`,
    },
    {
      title: '廠商',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 120,
    },
    {
      title: '執行率',
      dataIndex: 'executionRate',
      key: 'executionRate',
      width: 80,
      render: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      title: '備註',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: BudgetItem) => (
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
            title="確定要刪除這個預算項目嗎？"
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
        <h1 className="text-2xl font-bold mb-2">預算規劃</h1>
        <p className="text-gray-600">須具備新增預算功能</p>
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
            新增預算
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
          dataSource={budgetData}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingItem ? '編輯預算' : '新增預算'}
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
            name="category"
            label="類別"
            rules={[{ required: true, message: '請輸入類別' }]}
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
            name="budget"
            label="預算"
            rules={[{ required: true, message: '請輸入預算金額' }]}
          >
            <InputNumber
              placeholder="請輸入預算金額"
              style={{ width: '100%' }}
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
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