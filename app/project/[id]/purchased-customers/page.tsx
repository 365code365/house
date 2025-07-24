'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Tag, Progress, Drawer } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined, EyeOutlined, PhoneOutlined, MessageOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { formatCurrency } from '@/lib/utils'

const { Option } = Select
const { TextArea } = Input

interface PurchasedCustomerItem {
  id: number
  customerName: string
  contactPhone: string
  email: string
  houseNo: string
  houseType: string
  purchaseDate: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: 'COMPLETED' | 'PARTIAL' | 'PENDING'
  contractStatus: 'SIGNED' | 'PENDING' | 'CANCELLED'
  handoverStatus: 'COMPLETED' | 'SCHEDULED' | 'PENDING'
  handoverDate: string | null
  salesPerson: string
  remark: string
  createdAt: string
  lastContactDate: string | null
  nextFollowUpDate: string | null
}

interface CustomerFormData {
  customerName: string
  contactPhone: string
  email: string
  houseNo: string
  houseType: string
  purchaseDate: dayjs.Dayjs
  totalAmount: number
  paidAmount: number
  paymentStatus: 'COMPLETED' | 'PARTIAL' | 'PENDING'
  contractStatus: 'SIGNED' | 'PENDING' | 'CANCELLED'
  handoverStatus: 'COMPLETED' | 'SCHEDULED' | 'PENDING'
  handoverDate: dayjs.Dayjs | null
  salesPerson: string
  remark: string
  lastContactDate: dayjs.Dayjs | null
  nextFollowUpDate: dayjs.Dayjs | null
}

export default function PurchasedCustomersPage() {
  const params = useParams()
  const projectId = params.id as string
  const [customerData, setCustomerData] = useState<PurchasedCustomerItem[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<PurchasedCustomerItem | null>(null)
  const [viewingItem, setViewingItem] = useState<PurchasedCustomerItem | null>(null)
  const [form] = Form.useForm()

  // 模拟数据
  const mockData: PurchasedCustomerItem[] = [
    {
      id: 1,
      customerName: '王小明',
      contactPhone: '0912-345-678',
      email: 'wang@example.com',
      houseNo: 'A1-101',
      houseType: '3房2廳2衛',
      purchaseDate: '2024/12/15',
      totalAmount: 2800000,
      paidAmount: 2800000,
      remainingAmount: 0,
      paymentStatus: 'COMPLETED',
      contractStatus: 'SIGNED',
      handoverStatus: 'COMPLETED',
      handoverDate: '2025/01/10',
      salesPerson: '張業務',
      remark: '優質客戶，已完成所有手續',
      createdAt: '2024/12/15 14:30',
      lastContactDate: '2025/01/10',
      nextFollowUpDate: null
    },
    {
      id: 2,
      customerName: '李小華',
      contactPhone: '0923-456-789',
      email: 'li@example.com',
      houseNo: 'A1-102',
      houseType: '2房1廳1衛',
      purchaseDate: '2024/12/20',
      totalAmount: 1800000,
      paidAmount: 900000,
      remainingAmount: 900000,
      paymentStatus: 'PARTIAL',
      contractStatus: 'SIGNED',
      handoverStatus: 'SCHEDULED',
      handoverDate: '2025/02/15',
      salesPerson: '陳業務',
      remark: '尾款預計2月初付清',
      createdAt: '2024/12/20 16:45',
      lastContactDate: '2025/01/05',
      nextFollowUpDate: '2025/02/01'
    },
    {
      id: 3,
      customerName: '張大同',
      contactPhone: '0934-567-890',
      email: 'zhang@example.com',
      houseNo: 'A1-103',
      houseType: '4房2廳3衛',
      purchaseDate: '2025/01/05',
      totalAmount: 3500000,
      paidAmount: 1750000,
      remainingAmount: 1750000,
      paymentStatus: 'PARTIAL',
      contractStatus: 'SIGNED',
      handoverStatus: 'PENDING',
      handoverDate: null,
      salesPerson: '林業務',
      remark: '分期付款，每月50萬',
      createdAt: '2025/01/05 10:20',
      lastContactDate: '2025/01/12',
      nextFollowUpDate: '2025/02/05'
    },
    {
      id: 4,
      customerName: '陳美玲',
      contactPhone: '0945-678-901',
      email: 'chen@example.com',
      houseNo: 'A1-104',
      houseType: '3房2廳2衛',
      purchaseDate: '2025/01/08',
      totalAmount: 2600000,
      paidAmount: 0,
      remainingAmount: 2600000,
      paymentStatus: 'PENDING',
      contractStatus: 'PENDING',
      handoverStatus: 'PENDING',
      handoverDate: null,
      salesPerson: '王業務',
      remark: '合約審核中',
      createdAt: '2025/01/08 11:15',
      lastContactDate: '2025/01/10',
      nextFollowUpDate: '2025/01/20'
    },
    {
      id: 5,
      customerName: '林志明',
      contactPhone: '0956-789-012',
      email: 'lin@example.com',
      houseNo: 'A1-105',
      houseType: '2房1廳1衛',
      purchaseDate: '2025/01/12',
      totalAmount: 1900000,
      paidAmount: 1900000,
      remainingAmount: 0,
      paymentStatus: 'COMPLETED',
      contractStatus: 'SIGNED',
      handoverStatus: 'SCHEDULED',
      handoverDate: '2025/03/01',
      salesPerson: '劉業務',
      remark: '一次付清，預計3月交屋',
      createdAt: '2025/01/12 15:30',
      lastContactDate: '2025/01/15',
      nextFollowUpDate: '2025/02/15'
    }
  ]

  const houseTypes = [
    '1房1廳1衛',
    '2房1廳1衛',
    '2房2廳1衛',
    '3房2廳2衛',
    '4房2廳3衛',
    '其他'
  ]

  const salesPersons = [
    '張業務',
    '陳業務',
    '林業務',
    '王業務',
    '劉業務',
    '黃業務'
  ]

  useEffect(() => {
    // 模拟加载数据
    setCustomerData(mockData)
  }, [])

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    // 设置默认值
    form.setFieldsValue({
      paymentStatus: 'PENDING',
      contractStatus: 'PENDING',
      handoverStatus: 'PENDING'
    })
    setIsModalVisible(true)
  }

  const handleEdit = (item: PurchasedCustomerItem) => {
    setEditingItem(item)
    form.setFieldsValue({
      ...item,
      purchaseDate: item.purchaseDate ? dayjs(item.purchaseDate) : null,
      handoverDate: item.handoverDate ? dayjs(item.handoverDate) : null,
      lastContactDate: item.lastContactDate ? dayjs(item.lastContactDate) : null,
      nextFollowUpDate: item.nextFollowUpDate ? dayjs(item.nextFollowUpDate) : null
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      // 这里应该调用API删除数据
      setCustomerData(prev => prev.filter(item => item.id !== id))
      message.success('刪除成功')
    } catch (error) {
      message.error('刪除失敗')
    }
  }

  const handleSubmit = async (values: CustomerFormData) => {
    try {
      const purchaseDate = values.purchaseDate.format('YYYY/MM/DD')
      const handoverDate = values.handoverDate ? values.handoverDate.format('YYYY/MM/DD') : null
      const lastContactDate = values.lastContactDate ? values.lastContactDate.format('YYYY/MM/DD') : null
      const nextFollowUpDate = values.nextFollowUpDate ? values.nextFollowUpDate.format('YYYY/MM/DD') : null
      const createdAt = dayjs().format('YYYY/MM/DD HH:mm')
      
      const remainingAmount = values.totalAmount - values.paidAmount
      
      const newItem: PurchasedCustomerItem = {
        id: editingItem ? editingItem.id : Date.now(),
        customerName: values.customerName,
        contactPhone: values.contactPhone,
        email: values.email,
        houseNo: values.houseNo,
        houseType: values.houseType,
        purchaseDate,
        totalAmount: values.totalAmount,
        paidAmount: values.paidAmount,
        remainingAmount,
        paymentStatus: values.paymentStatus,
        contractStatus: values.contractStatus,
        handoverStatus: values.handoverStatus,
        handoverDate,
        salesPerson: values.salesPerson,
        remark: values.remark,
        createdAt: editingItem ? editingItem.createdAt : createdAt,
        lastContactDate,
        nextFollowUpDate
      }

      if (editingItem) {
        setCustomerData(prev => prev.map(item => 
          item.id === editingItem.id ? newItem : item
        ))
        message.success('更新成功')
      } else {
        setCustomerData(prev => [...prev, newItem])
        message.success('新增成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('操作失敗')
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'green'
      case 'PARTIAL': return 'orange'
      case 'PENDING': return 'red'
      default: return 'default'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '已完成'
      case 'PARTIAL': return '部分付款'
      case 'PENDING': return '待付款'
      default: return status
    }
  }

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNED': return 'green'
      case 'PENDING': return 'orange'
      case 'CANCELLED': return 'red'
      default: return 'default'
    }
  }

  const getContractStatusText = (status: string) => {
    switch (status) {
      case 'SIGNED': return '已簽約'
      case 'PENDING': return '待簽約'
      case 'CANCELLED': return '已取消'
      default: return status
    }
  }

  const getHandoverStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'green'
      case 'SCHEDULED': return 'blue'
      case 'PENDING': return 'orange'
      default: return 'default'
    }
  }

  const getHandoverStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '已交屋'
      case 'SCHEDULED': return '已安排'
      case 'PENDING': return '待安排'
      default: return status
    }
  }

  const columns = [
    {
      title: '客戶姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '聯絡電話',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 130,
    },
    {
      title: '房號',
      dataIndex: 'houseNo',
      key: 'houseNo',
      width: 100,
    },
    {
      title: '房型',
      dataIndex: 'houseType',
      key: 'houseType',
      width: 120,
    },
    {
      title: '購買日期',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 120,
      sorter: (a: PurchasedCustomerItem, b: PurchasedCustomerItem) => 
        new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime(),
    },
    {
      title: '總金額',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount: number) => formatCurrency(amount),
      sorter: (a: PurchasedCustomerItem, b: PurchasedCustomerItem) => a.totalAmount - b.totalAmount,
    },
    {
      title: '付款進度',
      key: 'paymentProgress',
      width: 150,
      render: (record: PurchasedCustomerItem) => {
        const percent = Math.round((record.paidAmount / record.totalAmount) * 100)
        return (
          <Progress 
            percent={percent} 
            size="small" 
            status={percent === 100 ? 'success' : 'active'}
            format={() => `${percent}%`}
          />
        )
      },
    },
    {
      title: '付款狀態',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>
          {getPaymentStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '已完成', value: 'COMPLETED' },
        { text: '部分付款', value: 'PARTIAL' },
        { text: '待付款', value: 'PENDING' },
      ],
      onFilter: (value: any, record: PurchasedCustomerItem) => record.paymentStatus === value,
    },
    {
      title: '合約狀態',
      dataIndex: 'contractStatus',
      key: 'contractStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={getContractStatusColor(status)}>
          {getContractStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '已簽約', value: 'SIGNED' },
        { text: '待簽約', value: 'PENDING' },
        { text: '已取消', value: 'CANCELLED' },
      ],
      onFilter: (value: any, record: PurchasedCustomerItem) => record.contractStatus === value,
    },
    {
      title: '交屋狀態',
      dataIndex: 'handoverStatus',
      key: 'handoverStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={getHandoverStatusColor(status)}>
          {getHandoverStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '已交屋', value: 'COMPLETED' },
        { text: '已安排', value: 'SCHEDULED' },
        { text: '待安排', value: 'PENDING' },
      ],
      onFilter: (value: any, record: PurchasedCustomerItem) => record.handoverStatus === value,
    },
    {
      title: '負責業務',
      dataIndex: 'salesPerson',
      key: 'salesPerson',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (record: PurchasedCustomerItem) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => {
              setViewingItem(record)
              setIsDetailDrawerVisible(true)
            }}
          >
            詳情
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          <Popconfirm
            title="確定要刪除這筆記錄嗎？"
            onConfirm={() => handleDelete(record.id)}
            okText="確定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              刪除
            </Button>
          </Popconfirm>
          <Button 
            type="link" 
            icon={<PhoneOutlined />}
            onClick={() => window.open(`tel:${record.contactPhone}`)}
          >
            撥號
          </Button>
        </Space>
      ),
    },
  ]

  const handleViewDetail = (item: PurchasedCustomerItem) => {
    setViewingItem(item)
    setIsDetailDrawerVisible(true)
  }

  return (
    <div>
      <Card 
        title="已購客戶列表" 
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增客戶
            </Button>
            <Button icon={<ExportOutlined />}>
              匯出資料
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={customerData}
          rowKey="id"
          scroll={{ x: 1500, y: 600 }}
          pagination={{
            total: customerData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
        />
      </Card>

      <Modal
        title={editingItem ? '編輯客戶' : '新增客戶'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="customerName"
              label="客戶姓名"
              rules={[{ required: true, message: '請輸入客戶姓名' }]}
            >
              <Input placeholder="請輸入客戶姓名" />
            </Form.Item>

            <Form.Item
              name="contactPhone"
              label="聯絡電話"
              rules={[{ required: true, message: '請輸入聯絡電話' }]}
            >
              <Input placeholder="請輸入聯絡電話" />
            </Form.Item>

            <Form.Item
              name="email"
              label="電子郵件"
              rules={[{ required: true, message: '請輸入電子郵件' }, { type: 'email', message: '請輸入有效的電子郵件' }]}
            >
              <Input placeholder="請輸入電子郵件" />
            </Form.Item>

            <Form.Item
              name="houseNo"
              label="房號"
              rules={[{ required: true, message: '請輸入房號' }]}
            >
              <Input placeholder="請輸入房號" />
            </Form.Item>

            <Form.Item
              name="houseType"
              label="房型"
              rules={[{ required: true, message: '請選擇房型' }]}
            >
              <Select placeholder="請選擇房型">
                {houseTypes.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="purchaseDate"
              label="購買日期"
              rules={[{ required: true, message: '請選擇購買日期' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="請選擇購買日期" />
            </Form.Item>

            <Form.Item
              name="totalAmount"
              label="總金額"
              rules={[{ required: true, message: '請輸入總金額' }]}
            >
              <Input type="number" placeholder="請輸入總金額" addonBefore="NT$" />
            </Form.Item>

            <Form.Item
              name="paidAmount"
              label="已付金額"
              rules={[{ required: true, message: '請輸入已付金額' }]}
            >
              <Input type="number" placeholder="請輸入已付金額" addonBefore="NT$" />
            </Form.Item>

            <Form.Item
              name="paymentStatus"
              label="付款狀態"
              rules={[{ required: true, message: '請選擇付款狀態' }]}
            >
              <Select placeholder="請選擇付款狀態">
                <Option value="COMPLETED">已完成</Option>
                <Option value="PARTIAL">部分付款</Option>
                <Option value="PENDING">待付款</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="contractStatus"
              label="合約狀態"
              rules={[{ required: true, message: '請選擇合約狀態' }]}
            >
              <Select placeholder="請選擇合約狀態">
                <Option value="SIGNED">已簽約</Option>
                <Option value="PENDING">待簽約</Option>
                <Option value="CANCELLED">已取消</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="handoverStatus"
              label="交屋狀態"
              rules={[{ required: true, message: '請選擇交屋狀態' }]}
            >
              <Select placeholder="請選擇交屋狀態">
                <Option value="COMPLETED">已交屋</Option>
                <Option value="SCHEDULED">已安排</Option>
                <Option value="PENDING">待安排</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="handoverDate"
              label="交屋日期"
            >
              <DatePicker style={{ width: '100%' }} placeholder="請選擇交屋日期" />
            </Form.Item>

            <Form.Item
              name="salesPerson"
              label="負責業務"
              rules={[{ required: true, message: '請選擇負責業務' }]}
            >
              <Select placeholder="請選擇負責業務">
                {salesPersons.map(person => (
                  <Option key={person} value={person}>{person}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="lastContactDate"
              label="最後聯絡日期"
            >
              <DatePicker style={{ width: '100%' }} placeholder="請選擇最後聯絡日期" />
            </Form.Item>

            <Form.Item
              name="nextFollowUpDate"
              label="下次追蹤日期"
            >
              <DatePicker style={{ width: '100%' }} placeholder="請選擇下次追蹤日期" />
            </Form.Item>
          </div>

          <Form.Item
            name="remark"
            label="備註"
          >
            <TextArea rows={3} placeholder="請輸入備註" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? '更新' : '新增'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="客戶詳細資訊"
        placement="right"
        onClose={() => setIsDetailDrawerVisible(false)}
        open={isDetailDrawerVisible}
        width={600}
      >
        {viewingItem && (
          <div>
            <Card title="基本資訊" style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong>客戶姓名：</strong>{viewingItem.customerName}
                </div>
                <div>
                  <strong>聯絡電話：</strong>{viewingItem.contactPhone}
                </div>
                <div>
                  <strong>電子郵件：</strong>{viewingItem.email}
                </div>
                <div>
                  <strong>房號：</strong>{viewingItem.houseNo}
                </div>
                <div>
                  <strong>房型：</strong>{viewingItem.houseType}
                </div>
                <div>
                  <strong>購買日期：</strong>{viewingItem.purchaseDate}
                </div>
              </div>
            </Card>

            <Card title="付款資訊" style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong>總金額：</strong>{formatCurrency(viewingItem.totalAmount)}
                </div>
                <div>
                  <strong>已付金額：</strong>{formatCurrency(viewingItem.paidAmount)}
                </div>
                <div>
                  <strong>剩餘金額：</strong>{formatCurrency(viewingItem.remainingAmount)}
                </div>
                <div>
                  <strong>付款狀態：</strong>
                  <Tag color={getPaymentStatusColor(viewingItem.paymentStatus)} style={{ marginLeft: 8 }}>
                    {getPaymentStatusText(viewingItem.paymentStatus)}
                  </Tag>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <strong>付款進度：</strong>
                <Progress 
                  percent={Math.round((viewingItem.paidAmount / viewingItem.totalAmount) * 100)} 
                  status={viewingItem.paidAmount === viewingItem.totalAmount ? 'success' : 'active'}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Card>

            <Card title="狀態資訊" style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong>合約狀態：</strong>
                  <Tag color={getContractStatusColor(viewingItem.contractStatus)} style={{ marginLeft: 8 }}>
                    {getContractStatusText(viewingItem.contractStatus)}
                  </Tag>
                </div>
                <div>
                  <strong>交屋狀態：</strong>
                  <Tag color={getHandoverStatusColor(viewingItem.handoverStatus)} style={{ marginLeft: 8 }}>
                    {getHandoverStatusText(viewingItem.handoverStatus)}
                  </Tag>
                </div>
                <div>
                  <strong>交屋日期：</strong>{viewingItem.handoverDate || '未安排'}
                </div>
                <div>
                  <strong>負責業務：</strong>{viewingItem.salesPerson}
                </div>
              </div>
            </Card>

            <Card title="追蹤記錄">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong>建立時間：</strong>{viewingItem.createdAt}
                </div>
                <div>
                  <strong>最後聯絡：</strong>{viewingItem.lastContactDate || '無記錄'}
                </div>
                <div>
                  <strong>下次追蹤：</strong>{viewingItem.nextFollowUpDate || '未安排'}
                </div>
              </div>
              {viewingItem.remark && (
                <div style={{ marginTop: 16 }}>
                  <strong>備註：</strong>
                  <div style={{ marginTop: 8, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                    {viewingItem.remark}
                  </div>
                </div>
              )}
            </Card>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PhoneOutlined />}
                  onClick={() => window.open(`tel:${viewingItem.contactPhone}`)}
                >
                  撥打電話
                </Button>
                <Button 
                  icon={<MessageOutlined />}
                  onClick={() => window.open(`sms:${viewingItem.contactPhone}`)}
                >
                  發送簡訊
                </Button>
                <Button 
                  icon={<EditOutlined />}
                  onClick={() => {
                    setIsDetailDrawerVisible(false)
                    handleEdit(viewingItem)
                  }}
                >
                  編輯資料
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}