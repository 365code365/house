'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Tag, Rate, Progress } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface VisitorQuestionnaireItem {
  id: number
  visitorName: string
  contactPhone: string
  visitDate: string
  houseType: string
  satisfactionRating: number
  interestedFeatures: string[]
  purchaseIntention: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  budgetRange: string
  feedback: string
  followUpStatus: 'PENDING' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED'
  salesPerson: string
  createdAt: string
}

interface QuestionnaireFormData {
  visitorName: string
  contactPhone: string
  visitDate: dayjs.Dayjs
  houseType: string
  satisfactionRating: number
  interestedFeatures: string[]
  purchaseIntention: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  budgetRange: string
  feedback: string
  followUpStatus: 'PENDING' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED'
  salesPerson: string
}

export default function VisitorQuestionnairePage() {
  const params = useParams()
  const projectId = params.id as string
  const [loading, setLoading] = useState(true)
  const [questionnaireData, setQuestionnaireData] = useState<VisitorQuestionnaireItem[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<VisitorQuestionnaireItem | null>(null)
  const [viewingItem, setViewingItem] = useState<VisitorQuestionnaireItem | null>(null)
  const [form] = Form.useForm()

  // 模拟数据
  const mockData: VisitorQuestionnaireItem[] = [
    {
      id: 1,
      visitorName: '王小明',
      contactPhone: '0912-345-678',
      visitDate: '2025/01/15',
      houseType: '3房2廳2衛',
      satisfactionRating: 5,
      interestedFeatures: ['景觀', '交通便利', '學區'],
      purchaseIntention: 'HIGH',
      budgetRange: '2000-3000萬',
      feedback: '非常滿意整體規劃，特別喜歡景觀設計和交通便利性。希望能了解更多付款方式。',
      followUpStatus: 'CONTACTED',
      salesPerson: '張業務',
      createdAt: '2025/01/15 14:30'
    },
    {
      id: 2,
      visitorName: '李小華',
      contactPhone: '0923-456-789',
      visitDate: '2025/01/14',
      houseType: '2房1廳1衛',
      satisfactionRating: 4,
      interestedFeatures: ['價格合理', '格局方正'],
      purchaseIntention: 'MEDIUM',
      budgetRange: '1500-2000萬',
      feedback: '格局不錯，但希望能有更多收納空間。',
      followUpStatus: 'SCHEDULED',
      salesPerson: '陳業務',
      createdAt: '2025/01/14 16:45'
    },
    {
      id: 3,
      visitorName: '張大同',
      contactPhone: '0934-567-890',
      visitDate: '2025/01/13',
      houseType: '4房2廳3衛',
      satisfactionRating: 3,
      interestedFeatures: ['空間大', '採光好'],
      purchaseIntention: 'LOW',
      budgetRange: '3000-4000萬',
      feedback: '空間很大，但價格稍高，需要再考慮。',
      followUpStatus: 'PENDING',
      salesPerson: '林業務',
      createdAt: '2025/01/13 10:20'
    },
    {
      id: 4,
      visitorName: '陳美玲',
      contactPhone: '0945-678-901',
      visitDate: '2025/01/12',
      houseType: '3房2廳2衛',
      satisfactionRating: 5,
      interestedFeatures: ['景觀', '建材品質', '社區設施'],
      purchaseIntention: 'HIGH',
      budgetRange: '2500-3500萬',
      feedback: '非常喜歡，已決定購買，希望盡快簽約。',
      followUpStatus: 'COMPLETED',
      salesPerson: '王業務',
      createdAt: '2025/01/12 11:15'
    },
    {
      id: 5,
      visitorName: '林志明',
      contactPhone: '0956-789-012',
      visitDate: '2025/01/11',
      houseType: '2房1廳1衛',
      satisfactionRating: 2,
      interestedFeatures: ['交通便利'],
      purchaseIntention: 'NONE',
      budgetRange: '1000-1500萬',
      feedback: '交通方便，但房型不符合需求。',
      followUpStatus: 'COMPLETED',
      salesPerson: '劉業務',
      createdAt: '2025/01/11 15:30'
    }
  ]

  const houseTypeOptions = [
    '1房1廳1衛',
    '2房1廳1衛',
    '2房2廳1衛',
    '3房2廳2衛',
    '4房2廳3衛',
    '其他'
  ]

  const featureOptions = [
    '景觀',
    '交通便利',
    '學區',
    '價格合理',
    '格局方正',
    '空間大',
    '採光好',
    '建材品質',
    '社區設施',
    '停車便利',
    '生活機能',
    '投資價值'
  ]

  const budgetOptions = [
    '1000萬以下',
    '1000-1500萬',
    '1500-2000萬',
    '2000-2500萬',
    '2500-3000萬',
    '3000-3500萬',
    '3500-4000萬',
    '4000萬以上'
  ]

  const salesPersonOptions = [
    '張業務',
    '陳業務',
    '林業務',
    '王業務',
    '劉業務',
    '黃業務'
  ]

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setQuestionnaireData(mockData)
      setLoading(false)
    }, 1000)
  }, [projectId])

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      visitDate: dayjs(),
      satisfactionRating: 5,
      interestedFeatures: [],
      purchaseIntention: 'MEDIUM',
      followUpStatus: 'PENDING'
    })
    setIsModalVisible(true)
  }

  const handleEdit = (record: VisitorQuestionnaireItem) => {
    setEditingItem(record)
    form.setFieldsValue({
      visitorName: record.visitorName,
      contactPhone: record.contactPhone,
      visitDate: dayjs(record.visitDate),
      houseType: record.houseType,
      satisfactionRating: record.satisfactionRating,
      interestedFeatures: record.interestedFeatures,
      purchaseIntention: record.purchaseIntention,
      budgetRange: record.budgetRange,
      feedback: record.feedback,
      followUpStatus: record.followUpStatus,
      salesPerson: record.salesPerson
    })
    setIsModalVisible(true)
  }

  const handleView = (record: VisitorQuestionnaireItem) => {
    setViewingItem(record)
    setIsDetailModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      setQuestionnaireData(prev => prev.filter(item => item.id !== id))
      message.success('刪除成功')
    } catch (error) {
      message.error('刪除失敗')
    }
  }

  const handleSubmit = async (values: QuestionnaireFormData) => {
    try {
      const visitDate = values.visitDate.format('YYYY/MM/DD')
      const createdAt = dayjs().format('YYYY/MM/DD HH:mm')

      if (editingItem) {
        // 编辑
        setQuestionnaireData(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { 
                ...item, 
                visitorName: values.visitorName,
                contactPhone: values.contactPhone,
                visitDate,
                houseType: values.houseType,
                satisfactionRating: values.satisfactionRating,
                interestedFeatures: values.interestedFeatures,
                purchaseIntention: values.purchaseIntention,
                budgetRange: values.budgetRange,
                feedback: values.feedback,
                followUpStatus: values.followUpStatus,
                salesPerson: values.salesPerson
              }
            : item
        ))
        message.success('更新成功')
      } else {
        // 新增
        const newItem: VisitorQuestionnaireItem = {
          id: Date.now(),
          visitorName: values.visitorName,
          contactPhone: values.contactPhone,
          visitDate,
          houseType: values.houseType,
          satisfactionRating: values.satisfactionRating,
          interestedFeatures: values.interestedFeatures,
          purchaseIntention: values.purchaseIntention,
          budgetRange: values.budgetRange,
          feedback: values.feedback,
          followUpStatus: values.followUpStatus,
          salesPerson: values.salesPerson,
          createdAt
        }
        setQuestionnaireData(prev => [...prev, newItem])
        message.success('新增成功')
      }
      setIsModalVisible(false)
    } catch (error) {
      message.error('操作失敗')
    }
  }

  const getIntentionColor = (intention: string) => {
    switch (intention) {
      case 'HIGH': return 'red'
      case 'MEDIUM': return 'orange'
      case 'LOW': return 'blue'
      case 'NONE': return 'default'
      default: return 'default'
    }
  }

  const getIntentionText = (intention: string) => {
    switch (intention) {
      case 'HIGH': return '高'
      case 'MEDIUM': return '中'
      case 'LOW': return '低'
      case 'NONE': return '無'
      default: return intention
    }
  }

  const getFollowUpColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange'
      case 'CONTACTED': return 'blue'
      case 'SCHEDULED': return 'purple'
      case 'COMPLETED': return 'green'
      default: return 'default'
    }
  }

  const getFollowUpText = (status: string) => {
    switch (status) {
      case 'PENDING': return '待處理'
      case 'CONTACTED': return '已聯絡'
      case 'SCHEDULED': return '已安排'
      case 'COMPLETED': return '已完成'
      default: return status
    }
  }

  const columns = [
    {
      title: '訪客姓名',
      dataIndex: 'visitorName',
      key: 'visitorName',
      width: 100,
    },
    {
      title: '聯絡電話',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 120,
    },
    {
      title: '參觀日期',
      dataIndex: 'visitDate',
      key: 'visitDate',
      width: 100,
      sorter: (a: VisitorQuestionnaireItem, b: VisitorQuestionnaireItem) => 
        dayjs(a.visitDate).unix() - dayjs(b.visitDate).unix(),
    },
    {
      title: '房型',
      dataIndex: 'houseType',
      key: 'houseType',
      width: 120,
    },
    {
      title: '滿意度',
      dataIndex: 'satisfactionRating',
      key: 'satisfactionRating',
      width: 120,
      render: (rating: number) => (
        <Rate disabled value={rating} style={{ fontSize: 14 }} />
      ),
      sorter: (a: VisitorQuestionnaireItem, b: VisitorQuestionnaireItem) => 
        a.satisfactionRating - b.satisfactionRating,
    },
    {
      title: '購買意願',
      dataIndex: 'purchaseIntention',
      key: 'purchaseIntention',
      width: 100,
      render: (intention: string) => (
        <Tag color={getIntentionColor(intention)}>
          {getIntentionText(intention)}
        </Tag>
      ),
      filters: [
        { text: '高', value: 'HIGH' },
        { text: '中', value: 'MEDIUM' },
        { text: '低', value: 'LOW' },
        { text: '無', value: 'NONE' },
      ],
      onFilter: (value: any, record: VisitorQuestionnaireItem) => record.purchaseIntention === value,
    },
    {
      title: '預算範圍',
      dataIndex: 'budgetRange',
      key: 'budgetRange',
      width: 120,
    },
    {
      title: '追蹤狀態',
      dataIndex: 'followUpStatus',
      key: 'followUpStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={getFollowUpColor(status)}>
          {getFollowUpText(status)}
        </Tag>
      ),
      filters: [
        { text: '待處理', value: 'PENDING' },
        { text: '已聯絡', value: 'CONTACTED' },
        { text: '已安排', value: 'SCHEDULED' },
        { text: '已完成', value: 'COMPLETED' },
      ],
      onFilter: (value: any, record: VisitorQuestionnaireItem) => record.followUpStatus === value,
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
      width: 150,
      render: (_: any, record: VisitorQuestionnaireItem) => (
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
            title="確定要刪除這個問卷記錄嗎？"
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
    total: questionnaireData.length,
    highIntention: questionnaireData.filter(item => item.purchaseIntention === 'HIGH').length,
    avgSatisfaction: questionnaireData.length > 0 
      ? (questionnaireData.reduce((sum, item) => sum + item.satisfactionRating, 0) / questionnaireData.length).toFixed(1)
      : '0',
    pendingFollowUp: questionnaireData.filter(item => item.followUpStatus === 'PENDING').length
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">訪客問卷</h1>
        <p className="text-gray-600">收集訪客意見回饋，提升服務品質</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500">總問卷數</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.highIntention}</div>
            <div className="text-sm text-gray-500">高購買意願</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.avgSatisfaction}</div>
            <div className="text-sm text-gray-500">平均滿意度</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingFollowUp}</div>
            <div className="text-sm text-gray-500">待追蹤</div>
          </div>
        </Card>
      </div>

      {/* 工具栏 */}
      <div className="mb-6">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增問卷
          </Button>
          <Button icon={<FileTextOutlined />}>
            問卷範本
          </Button>
          <Button icon={<ExportOutlined />}>
            匯出報告
          </Button>
        </Space>
      </div>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={questionnaireData}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1400 }}
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
        title={editingItem ? '編輯問卷' : '新增問卷'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="visitorName"
              label="訪客姓名"
              rules={[{ required: true, message: '請輸入訪客姓名' }]}
            >
              <Input placeholder="請輸入訪客姓名" />
            </Form.Item>

            <Form.Item
              name="contactPhone"
              label="聯絡電話"
              rules={[{ required: true, message: '請輸入聯絡電話' }]}
            >
              <Input placeholder="請輸入聯絡電話" />
            </Form.Item>

            <Form.Item
              name="visitDate"
              label="參觀日期"
              rules={[{ required: true, message: '請選擇參觀日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY/MM/DD"
                placeholder="請選擇參觀日期"
              />
            </Form.Item>

            <Form.Item
              name="houseType"
              label="房型"
              rules={[{ required: true, message: '請選擇房型' }]}
            >
              <Select placeholder="請選擇房型">
                {houseTypeOptions.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="satisfactionRating"
              label="滿意度評分"
              rules={[{ required: true, message: '請評分' }]}
            >
              <Rate />
            </Form.Item>

            <Form.Item
              name="purchaseIntention"
              label="購買意願"
              rules={[{ required: true, message: '請選擇購買意願' }]}
            >
              <Select placeholder="請選擇購買意願">
                <Option value="HIGH">高</Option>
                <Option value="MEDIUM">中</Option>
                <Option value="LOW">低</Option>
                <Option value="NONE">無</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="budgetRange"
              label="預算範圍"
              rules={[{ required: true, message: '請選擇預算範圍' }]}
            >
              <Select placeholder="請選擇預算範圍">
                {budgetOptions.map(budget => (
                  <Option key={budget} value={budget}>{budget}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="salesPerson"
              label="負責業務"
              rules={[{ required: true, message: '請選擇負責業務' }]}
            >
              <Select placeholder="請選擇負責業務">
                {salesPersonOptions.map(person => (
                  <Option key={person} value={person}>{person}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="interestedFeatures"
            label="感興趣的特色"
          >
            <Select
              mode="multiple"
              placeholder="請選擇感興趣的特色"
              style={{ width: '100%' }}
            >
              {featureOptions.map(feature => (
                <Option key={feature} value={feature}>{feature}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="followUpStatus"
            label="追蹤狀態"
            rules={[{ required: true, message: '請選擇追蹤狀態' }]}
          >
            <Select placeholder="請選擇追蹤狀態">
              <Option value="PENDING">待處理</Option>
              <Option value="CONTACTED">已聯絡</Option>
              <Option value="SCHEDULED">已安排</Option>
              <Option value="COMPLETED">已完成</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="feedback"
            label="意見回饋"
          >
            <TextArea placeholder="請輸入意見回饋" rows={4} />
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

      {/* 详情查看模态框 */}
      <Modal
        title="問卷詳情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            關閉
          </Button>
        ]}
        width={600}
      >
        {viewingItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-gray-700">訪客姓名：</label>
                <div>{viewingItem.visitorName}</div>
              </div>
              <div>
                <label className="font-medium text-gray-700">聯絡電話：</label>
                <div>{viewingItem.contactPhone}</div>
              </div>
              <div>
                <label className="font-medium text-gray-700">參觀日期：</label>
                <div>{viewingItem.visitDate}</div>
              </div>
              <div>
                <label className="font-medium text-gray-700">房型：</label>
                <div>{viewingItem.houseType}</div>
              </div>
              <div>
                <label className="font-medium text-gray-700">滿意度：</label>
                <div><Rate disabled value={viewingItem.satisfactionRating} style={{ fontSize: 14 }} /></div>
              </div>
              <div>
                <label className="font-medium text-gray-700">購買意願：</label>
                <div>
                  <Tag color={getIntentionColor(viewingItem.purchaseIntention)}>
                    {getIntentionText(viewingItem.purchaseIntention)}
                  </Tag>
                </div>
              </div>
              <div>
                <label className="font-medium text-gray-700">預算範圍：</label>
                <div>{viewingItem.budgetRange}</div>
              </div>
              <div>
                <label className="font-medium text-gray-700">負責業務：</label>
                <div>{viewingItem.salesPerson}</div>
              </div>
            </div>
            
            <div>
              <label className="font-medium text-gray-700">感興趣的特色：</label>
              <div className="mt-1">
                {viewingItem.interestedFeatures.map(feature => (
                  <Tag key={feature} className="mb-1">{feature}</Tag>
                ))}
              </div>
            </div>
            
            <div>
              <label className="font-medium text-gray-700">追蹤狀態：</label>
              <div className="mt-1">
                <Tag color={getFollowUpColor(viewingItem.followUpStatus)}>
                  {getFollowUpText(viewingItem.followUpStatus)}
                </Tag>
              </div>
            </div>
            
            <div>
              <label className="font-medium text-gray-700">意見回饋：</label>
              <div className="mt-1 p-3 bg-gray-50 rounded">{viewingItem.feedback}</div>
            </div>
            
            <div>
              <label className="font-medium text-gray-700">建立時間：</label>
              <div>{viewingItem.createdAt}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}