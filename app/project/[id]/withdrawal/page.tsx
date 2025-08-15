'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  Typography,
  Divider,
  App
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useSession } from 'next-auth/react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import type {
  WithdrawalRecord,
  WithdrawalFormData,
  WithdrawalQueryParams,
  WithdrawalListResponse,
  WithdrawalStats
} from '@/types/withdrawal'
import { WITHDRAWAL_REASONS, WITHDRAWAL_STATUS_OPTIONS } from '@/types/withdrawal'

const { RangePicker } = DatePicker
const { Option } = Select
const { Title } = Typography

interface WithdrawalPageProps {}

const WithdrawalPage: React.FC<WithdrawalPageProps> = () => {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { message } = App.useApp()
  const projectId = params.id as string

  // 狀態管理
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<WithdrawalRecord[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<WithdrawalStats | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<WithdrawalRecord | null>(null)
  const [form] = Form.useForm()

  // 查詢參數
  const [queryParams, setQueryParams] = useState<WithdrawalQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    status: undefined,
    reason: undefined,
    building: undefined,
    startDate: undefined,
    endDate: undefined
  })

  // 權限檢查
  const canEdit = useMemo(() => {
    const userRole = session?.user?.role
    return ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_PERSON'].includes(userRole || '')
  }, [session?.user?.role])

  const canDelete = useMemo(() => {
    const userRole = session?.user?.role
    return ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(userRole || '')
  }, [session?.user?.role])

  // 獲取退戶記錄列表
  const fetchWithdrawalRecords = async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })

      const response = await fetch(`/api/projects/${projectId}/withdrawal-records?${searchParams}`)
      if (!response.ok) {
        throw new Error('獲取退戶記錄失敗')
      }

      const result: WithdrawalListResponse = await response.json()
      if (result.data && result.pagination) {
        setData(Array.isArray(result.data) ? result.data : [])
        setTotal(result.pagination.total || 0)
      } else {
        setData([])
        setTotal(0)
      }
    } catch (error) {
      console.error('獲取退戶記錄失敗:', error)
      setData([])
      setTotal(0)
      message.error('獲取退戶記錄失敗')
    } finally {
      setLoading(false)
    }
  }

  // 獲取統計數據
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/withdrawal-records/stats`)
      if (!response.ok) {
        throw new Error('獲取統計數據失敗')
      }

      const result = await response.json()
      if (result.data) {
        setStats(result.data)
      } else {
        setStats(null)
      }
    } catch (error) {
      console.error('獲取統計數據失敗:', error)
      setStats(null)
    }
  }

  // 初始化數據
  useEffect(() => {
    if (projectId) {
      fetchWithdrawalRecords()
      fetchStats()
    }
  }, [projectId, queryParams])

  // 處理搜索
  const handleSearch = (value: string) => {
    setQueryParams(prev => ({ ...prev, search: value, page: 1 }))
  }

  // 處理篩選
  const handleFilter = (key: keyof WithdrawalQueryParams, value: any) => {
    setQueryParams(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  // 處理日期範圍篩選
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setQueryParams(prev => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
        page: 1
      }))
    } else {
      setQueryParams(prev => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
        page: 1
      }))
    }
  }

  // 處理分頁
  const handleTableChange = (pagination: any) => {
    setQueryParams(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  // 打開新增/編輯模態框
  const openModal = (record?: WithdrawalRecord) => {
    setEditingRecord(record || null)
    if (record) {
      form.setFieldsValue({
        ...record,
        withdrawalDate: record.withdrawalDate ? dayjs(record.withdrawalDate) : undefined
      })
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 關閉模態框
  const closeModal = () => {
    setModalVisible(false)
    setEditingRecord(null)
    form.resetFields()
  }

  // 提交表單
  const handleSubmit = async (values: WithdrawalFormData) => {
    try {
      const submitData = {
        ...values,
        withdrawalDate: values.withdrawalDate ? dayjs(values.withdrawalDate).format('YYYY-MM-DD') : undefined
      }

      const url = editingRecord
        ? `/api/projects/${projectId}/withdrawal-records/${editingRecord.id}`
        : `/api/projects/${projectId}/withdrawal-records`
      
      const method = editingRecord ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '操作失敗')
      }

      message.success(editingRecord ? '更新成功' : '新增成功')
      closeModal()
      fetchWithdrawalRecords()
      fetchStats()
    } catch (error: any) {
      console.error('提交失敗:', error)
      message.error(error.message || '操作失敗')
    }
  }

  // 刪除記錄
  const handleDelete = async (record: WithdrawalRecord) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/withdrawal-records/${record.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '刪除失敗')
      }

      message.success('刪除成功')
      fetchWithdrawalRecords()
      fetchStats()
    } catch (error: any) {
      console.error('刪除失敗:', error)
      message.error(error.message || '刪除失敗')
    }
  }

  // 導出PDF
  const handleExportPDF = async () => {
    try {
      const { exportWithdrawalRecordsToPDF } = await import('@/lib/pdf-export')
      await exportWithdrawalRecordsToPDF(data, {
        title: '退戶記錄報表',
        subtitle: `項目：${projectId} | 生成時間：${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
        filename: `withdrawal-records-${projectId}-${dayjs().format('YYYY-MM-DD')}.pdf`
      })
      message.success('PDF導出成功')
    } catch (error) {
      console.error('導出失敗:', error)
      message.error('導出失敗')
    }
  }

  // 重置篩選
  const handleReset = () => {
    setQueryParams({
      page: 1,
      pageSize: 10,
      search: '',
      status: undefined,
      reason: undefined,
      building: undefined,
      startDate: undefined,
      endDate: undefined
    })
  }

  // 表格列定義
  const columns: ColumnsType<WithdrawalRecord> = [
    {
      title: '客戶姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
      fixed: 'left'
    },
    {
      title: '房號',
      key: 'houseNumber',
      width: 120,
      render: (_, record) => `${record.building}-${record.floor}-${record.unit}`
    },
    {
      title: '房型',
      dataIndex: 'houseType',
      key: 'houseType',
      width: 100
    },
    {
      title: '原價',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      width: 120,
      render: (value) => value ? `¥${value.toLocaleString()}` : '-'
    },
    {
      title: '已付金額',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 120,
      render: (value) => value ? `¥${value.toLocaleString()}` : '-'
    },
    {
      title: '退款金額',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 120,
      render: (value) => value ? `¥${value.toLocaleString()}` : '-'
    },
    {
      title: '退戶原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      ellipsis: {
        showTitle: false
      },
      render: (reason) => (
        <Tooltip placement="topLeft" title={reason}>
          {reason}
        </Tooltip>
      )
    },
    {
      title: '退戶日期',
      dataIndex: 'withdrawalDate',
      key: 'withdrawalDate',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusOption = WITHDRAWAL_STATUS_OPTIONS.find(option => option.value === status)
        return (
          <Tag color={statusOption?.color || 'default'}>
            {statusOption?.label || status}
          </Tag>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {canEdit && (
            <Tooltip title="編輯">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openModal(record)}
                size="small"
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="確定要刪除這條退戶記錄嗎？"
              onConfirm={() => handleDelete(record)}
              okText="確定"
              cancelText="取消"
            >
              <Tooltip title="刪除">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                  size="small"
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      {/* 頁面標題 */}
      <div className="mb-6">
        <Title level={2} className="!mb-2">
          <FileTextOutlined className="mr-2" />
          退戶記錄
        </Title>
        <p className="text-gray-600">管理項目的退戶記錄信息</p>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="總記錄數"
                value={stats.totalRecords}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="總退款金額"
                value={stats.totalRefundAmount}
                precision={0}
                prefix="¥"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="處理中"
                value={stats.statusCounts.PROCESSING}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="已完成"
                value={stats.statusCounts.COMPLETED}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索和篩選 */}
      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input.Search
              placeholder="搜索客戶姓名或房號"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="選擇狀態"
              allowClear
              style={{ width: '100%' }}
              value={queryParams.status}
              onChange={(value) => handleFilter('status', value)}
            >
              {WITHDRAWAL_STATUS_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="選擇退戶原因"
              allowClear
              style={{ width: '100%' }}
              value={queryParams.reason}
              onChange={(value) => handleFilter('reason', value)}
            >
              {WITHDRAWAL_REASONS.map(reason => (
                <Option key={reason} value={reason}>
                  {reason}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              placeholder={['開始日期', '結束日期']}
              style={{ width: '100%' }}
              onChange={handleDateRangeChange}
              value={queryParams.startDate && queryParams.endDate ? [
                dayjs(queryParams.startDate),
                dayjs(queryParams.endDate)
              ] : undefined}
            />
          </Col>
        </Row>
        <Divider />
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                disabled={!canEdit}
              >
                新增退戶記錄
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExportPDF}
              >
                導出PDF
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchWithdrawalRecords()}
              >
                刷新
              </Button>
              <Button onClick={handleReset}>
                重置篩選
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 數據表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={Array.isArray(data) ? data : []}
          rowKey="id"
          loading={loading}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.pageSize,
            total: total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 條，共 ${total} 條`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* 新增/編輯模態框 */}
      <Modal
        title={editingRecord ? '編輯退戶記錄' : '新增退戶記錄'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'APPLIED'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="客戶姓名"
                rules={[{ required: true, message: '請輸入客戶姓名' }]}
              >
                <Input placeholder="請輸入客戶姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="houseType"
                label="房型"
              >
                <Input placeholder="請輸入房型" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="building"
                label="樓棟"
                rules={[{ required: true, message: '請輸入樓棟' }]}
              >
                <Input placeholder="請輸入樓棟" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="floor"
                label="樓層"
                rules={[{ required: true, message: '請輸入樓層' }]}
              >
                <Input placeholder="請輸入樓層" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unit"
                label="房號"
                rules={[{ required: true, message: '請輸入房號' }]}
              >
                <Input placeholder="請輸入房號" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="originalPrice"
                label="原價"
              >
                <InputNumber
                  placeholder="請輸入原價"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (parseFloat(value!.replace(/¥\s?|(,*)/g, '')) || 0) as any}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="paidAmount"
                label="已付金額"
              >
                <InputNumber
                  placeholder="請輸入已付金額"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (parseFloat(value!.replace(/¥\s?|(,*)/g, '')) || 0) as any}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="refundAmount"
                label="退款金額"
              >
                <InputNumber
                  placeholder="請輸入退款金額"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (parseFloat(value!.replace(/¥\s?|(,*)/g, '')) || 0) as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="reason"
                label="退戶原因"
                rules={[{ required: true, message: '請選擇退戶原因' }]}
              >
                <Select placeholder="請選擇退戶原因">
                  {WITHDRAWAL_REASONS.map(reason => (
                    <Option key={reason} value={reason}>
                      {reason}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="withdrawalDate"
                label="退戶日期"
              >
                <DatePicker
                  placeholder="請選擇退戶日期"
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="狀態"
                rules={[{ required: true, message: '請選擇狀態' }]}
              >
                <Select placeholder="請選擇狀態">
                  {WITHDRAWAL_STATUS_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="remark"
            label="備註"
          >
            <Input.TextArea
              placeholder="請輸入備註信息"
              rows={3}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={closeModal}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '更新' : '新增'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default WithdrawalPage