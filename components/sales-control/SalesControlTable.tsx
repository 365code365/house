"use client"

import React, { useState } from 'react'
import {
  Table,
  Badge,
  Button,
  Input,
  Modal,
  Select,
  Typography,
  Row,
  Col,
  Space,
  message,
  Checkbox,
  Dropdown,
  MenuProps
} from 'antd'
import { EditOutlined, DeleteOutlined, DownOutlined } from '@ant-design/icons'

const { Text, Title } = Typography
const { Option } = Select
const { TextArea } = Input
import { formatCurrency, formatDate } from '@/lib/utils'
import { useUpdateSalesControl, useBatchUpdateSalesControl, useDeleteSalesControl } from '@/hooks/useSalesControl'

export interface SalesControlData {
  id: number
  project_id: number
  building: string
  floor: number
  unit: string
  house_no: string
  area: string
  unit_price: string
  house_total: string
  total_with_parking: string
  base_price: string
  premium_rate: string
  sales_status: string
  sales_date: string
  deposit_date: string
  sign_date: string
  buyer: string
  sales_id: string
  sales_person_name: string
  sales_person_employee_no: string
  parking_ids: string
  custom_change: number
  custom_change_content: string | null
  media_source: string | null
  introducer: string | null
  notes: string
  createdAt: string
  updatedAt: string
  parking_spaces: any[]
}

interface SalesControlTableProps {
  data: SalesControlData[]
  visibleColumns: string[]
  onDataChange: () => void
  projectId: number
  pagination?: {
    current: number
    pageSize: number
    total: number
    showSizeChanger?: boolean
    showQuickJumper?: boolean
    showTotal?: (total: number, range: [number, number]) => string
    pageSizeOptions?: string[]
    onChange: (page: number, pageSize?: number) => void
    onShowSizeChange?: (page: number, pageSize: number) => void
  }
}



const statusColors = {
  available: 'success',
  reserved: 'warning',
  sold: 'processing',
  withdrawn: 'error',
}

const statusLabels = {
  available: '可售',
  reserved: '預約',
  sold: '已售',
  withdrawn: '退戶',
}

function SalesControlTable({
  data,
  visibleColumns,
  onDataChange,
  projectId,
  pagination
}: SalesControlTableProps) {
  // React Query mutations
  const updateMutation = useUpdateSalesControl(projectId)
  const batchUpdateMutation = useBatchUpdateSalesControl(projectId)
  const deleteMutation = useDeleteSalesControl(projectId)
  const [editingUnit, setEditingUnit] = useState<SalesControlData | null>(null)
  const [withdrawingUnitId, setWithdrawingUnitId] = useState<number | null>(null)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [batchEditModalOpen, setBatchEditModalOpen] = useState(false)
  const [batchEditData, setBatchEditData] = useState<Partial<SalesControlData>>({})

  const allColumns = [
    { key: 'building', label: '棟別' },
    { key: 'floor', label: '樓層' },
    { key: 'house_no', label: '戶號' },
    { key: 'unit', label: '戶型' },
    { key: 'area', label: '面積' },
    { key: 'unit_price', label: '單價' },
    { key: 'house_total', label: '房屋總價' },
    { key: 'total_with_parking', label: '總價' },
    { key: 'sales_status', label: '銷售狀態' },
    { key: 'sales_person_name', label: '銷售人員' },
    { key: 'buyer', label: '客戶姓名' },
    { key: 'deposit_date', label: '下訂日期' },
    { key: 'sign_date', label: '簽約日期' },
    { key: 'custom_change', label: '客變需求' },
    { key: 'custom_change_content', label: '客變內容' },
    { key: 'media_source', label: '媒體來源' },
    { key: 'introducer', label: '介紹人' },
    { key: 'notes', label: '備註' },
    { key: 'actions', label: '操作' }
  ]

  const handleEdit = (unit: SalesControlData) => {
    setEditingUnit(unit)
  }

  const handleSaveEdit = async () => {
    if (!editingUnit) return
    
    try {
      await updateMutation.mutateAsync({
        id: editingUnit.id,
        updates: editingUnit
      })
      message.success('更新成功')
      setEditingUnit(null)
      onDataChange()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawingUnitId || !withdrawReason.trim()) return
    
    try {
      await deleteMutation.mutateAsync(withdrawingUnitId)
      message.success('退戶成功')
      setWithdrawingUnitId(null)
      setWithdrawReason('')
      onDataChange()
    } catch (error) {
      message.error('退戶失败')
    }
  }

  const handleBatchEdit = () => {
    setBatchEditModalOpen(true)
  }

  const handleBatchSave = async () => {
    if (selectedRowKeys.length === 0) return
    
    try {
      await batchUpdateMutation.mutateAsync({
        ids: selectedRowKeys as number[],
        updates: batchEditData
      })
      message.success(`批量更新 ${selectedRowKeys.length} 項成功`)
      setBatchEditModalOpen(false)
      setBatchEditData({})
      setSelectedRowKeys([])
      onDataChange()
    } catch (error) {
      message.error('批量更新失败')
    }
  }

  const handleBatchStatusChange = async (status: string) => {
    if (selectedRowKeys.length === 0) return
    
    try {
      await batchUpdateMutation.mutateAsync({
        ids: selectedRowKeys as number[],
        updates: { sales_status: status }
      })
      message.success(`批量更新狀態成功`)
      setSelectedRowKeys([])
      onDataChange()
    } catch (error) {
      message.error('批量更新狀態失败')
    }
  }

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) return
    
    Modal.confirm({
      title: '確認批量刪除',
      content: `確定要刪除選中的 ${selectedRowKeys.length} 條銷控記錄嗎？此操作不可恢復。`,
      okText: '確認刪除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch(`/api/projects/${projectId}/sales-control/batch`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: selectedRowKeys }),
          })
          
          if (!response.ok) {
            throw new Error('批量刪除失敗')
          }
          
          message.success(`成功刪除 ${selectedRowKeys.length} 條記錄`)
          setSelectedRowKeys([])
          onDataChange()
        } catch (error) {
          message.error('批量刪除失敗')
        }
      },
    })
  }

  const batchMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: '批量編輯',
      onClick: handleBatchEdit,
    },
    {
      type: 'divider',
    },
    {
      key: '2',
      label: '設為未售出',
      onClick: () => handleBatchStatusChange('未售出'),
    },
    {
      key: '3',
      label: '設為訂金',
      onClick: () => handleBatchStatusChange('訂金'),
    },
    {
      key: '4',
      label: '設為售出',
      onClick: () => handleBatchStatusChange('售出'),
    },
    {
      key: '5',
      label: '設為不銷售',
      onClick: () => handleBatchStatusChange('不銷售'),
    },
    {
      type: 'divider',
    },
    {
      key: '6',
      label: '批量刪除',
      danger: true,
      onClick: handleBatchDelete,
    },
  ]

  const toggleColumnVisibility = (columnKey: string) => {
    // This will be handled by parent component
    console.log('Toggle column visibility:', columnKey)
  }

  const columns = [
    {
      title: '棟別',
      dataIndex: 'building',
      key: 'building',
    },
    {
      title: '樓層',
      dataIndex: 'floor',
      key: 'floor',
    },
    {
      title: '戶號',
      dataIndex: 'house_no',
      key: 'house_no',
    },
    {
      title: '戶型',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '面積',
      dataIndex: 'area',
      key: 'area',
      render: (area: string) => area ? `${area} 坪` : '-',
    },
    {
      title: '單價',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: string) => price ? formatCurrency(parseFloat(price)) : '-',
    },
    {
      title: '房屋總價',
      dataIndex: 'house_total',
      key: 'house_total',
      render: (price: string) => price ? formatCurrency(parseFloat(price)) : '-',
    },
    {
      title: '車位價格',
      dataIndex: 'parking_spaces',
      key: 'parking_price',
      render: (parkingSpaces: any[]) => {
        if (parkingSpaces && parkingSpaces.length > 0) {
          const totalPrice = parkingSpaces.reduce((sum, ps) => sum + (parseFloat(ps.price) || 0), 0)
          return totalPrice > 0 ? formatCurrency(totalPrice) : '-'
        }
        return '-'
      },
    },
    {
      title: '總價',
      dataIndex: 'total_with_parking',
      key: 'total_with_parking',
      render: (price: string) => price ? formatCurrency(parseFloat(price)) : '-',
    },
    {
      title: '銷售狀況',
      dataIndex: 'sales_status',
      key: 'sales_status',
      render: (status: string) => {
        const statusMap = {
          '售出': { color: 'success', text: '售出' },
          '訂金': { color: 'warning', text: '訂金' },
          '未售出': { color: 'default', text: '未售出' },
          '不銷售': { color: 'error', text: '不銷售' }
        }
        const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
        return <Badge color={statusInfo.color}>{statusInfo.text}</Badge>
      },
    },
    {
      title: '銷售人員',
      dataIndex: 'sales_person_name',
      key: 'sales_person_name',
      render: (salesPerson: string) => salesPerson || '-',
    },
    {
      title: '客戶姓名',
      dataIndex: 'buyer',
      key: 'buyer_names',
      render: (buyer: string) => buyer || '-',
    },
    {
      title: '買方人數',
      dataIndex: 'buyer',
      key: 'buyer_count',
      render: (buyer: string) => {
        if (!buyer) return 0
        return buyer.split(',').filter(name => name.trim()).length
      },
    },
    {
      title: '下訂日期',
      dataIndex: 'deposit_date',
      key: 'order_date',
      render: (date: string) => date ? formatDate(date) : '-',
    },
    {
      title: '簽約日期',
      dataIndex: 'sign_date',
      key: 'contract_date',
      render: (date: string) => date ? formatDate(date) : '-',
    },
    {
      title: '客變需求',
      dataIndex: 'custom_change',
      key: 'custom_requirements',
      render: (customChange: number) => customChange ? '是' : '否',
    },
    {
      title: '客變內容',
      dataIndex: 'custom_change_content',
      key: 'custom_content',
      render: (content: string) => content || '-',
    },
    {
      title: '底價',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (price: string) => price ? formatCurrency(parseFloat(price)) : '-',
    },
    {
      title: '溢價率',
      dataIndex: 'premium_rate',
      key: 'premium_rate',
      render: (rate: string) => rate ? `${rate}%` : '-',
    },
    {
      title: '媒體來源',
      dataIndex: 'media_source',
      key: 'media_source',
      render: (source: string) => source || '-',
    },
    {
      title: '備註',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => notes ? notes.replace(/\n/g, ' ').replace(/\r/g, ' ') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: SalesControlData) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          {record.sales_status === 'sold' && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => setWithdrawingUnitId(record.id)}
            >
              退戶
            </Button>
          )}
        </Space>
      ),
    },
  ].filter(col => visibleColumns.includes(col.key))

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys)
    },
    onSelectAll: (selected: boolean, selectedRows: SalesControlData[], changeRows: SalesControlData[]) => {
      console.log('Select all:', selected, selectedRows, changeRows)
    },
  }

  return (
    <div>
      {/* Batch Operations */}
      {selectedRowKeys.length > 0 && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          backgroundColor: '#f0f2f5', 
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text>已選擇 {selectedRowKeys.length} 項</Text>
          <Space>
            <Button onClick={() => setSelectedRowKeys([])}>
              取消選擇
            </Button>
            <Dropdown menu={{ items: batchMenuItems }} trigger={['click']}>
              <Button type="primary">
                批量操作 <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>
      )}

      {/* Column Visibility Settings */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Modal
          title="欄位顯示設定"
          open={columnSettingsOpen}
          onCancel={() => setColumnSettingsOpen(false)}
          footer={null}
        >
          <Row gutter={[16, 8]}>
            {allColumns.map((column) => (
              <Col span={12} key={column.key}>
                <Space>
                  <input
                    type="checkbox"
                    id={column.key}
                    checked={visibleColumns.includes(column.key)}
                    onChange={() => toggleColumnVisibility(column.key)}
                  />
                  <label htmlFor={column.key}>{column.label}</label>
                </Space>
              </Col>
            ))}
          </Row>
        </Modal>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={pagination || false}
        scroll={{ x: 'max-content' }}
        rowSelection={rowSelection}
      />

      {/* Edit Dialog */}
      <Modal
        title="編輯戶別資料"
        open={!!editingUnit}
        onCancel={() => setEditingUnit(null)}
        onOk={handleSaveEdit}
        okText="儲存"
        cancelText="取消"
        width={800}
      >
        {editingUnit && (
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text>戶型</Text>
                <Input
                  value={editingUnit.unit}
                  onChange={(e) => setEditingUnit({ ...editingUnit, unit: e.target.value })}
                  style={{ marginTop: '4px' }}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text>面積</Text>
                <Input
                  value={editingUnit.area}
                  onChange={(e) => setEditingUnit({ ...editingUnit, area: e.target.value })}
                  style={{ marginTop: '4px' }}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text>單價</Text>
                <Input
                  value={editingUnit.unit_price}
                  onChange={(e) => setEditingUnit({ ...editingUnit, unit_price: e.target.value })}
                  style={{ marginTop: '4px' }}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text>狀態</Text>
                <Select
                  value={editingUnit.sales_status}
                  onChange={(value) => setEditingUnit({ ...editingUnit, sales_status: value })}
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <Option value="未售出">未售出</Option>
                  <Option value="預約中">預約中</Option>
                  <Option value="已售出">已售出</Option>
                  <Option value="已退戶">已退戶</Option>
                </Select>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text>銷售人員</Text>
                <Input
                  value={editingUnit.sales_person_name || ''}
                  onChange={(e) => setEditingUnit({ ...editingUnit, sales_person_name: e.target.value })}
                  style={{ marginTop: '4px' }}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text>客戶姓名</Text>
                <Input
                  value={editingUnit.buyer || ''}
                  onChange={(e) => setEditingUnit({ ...editingUnit, buyer: e.target.value })}
                  style={{ marginTop: '4px' }}
                />
              </div>
            </Col>
          </Row>
        )}
      </Modal>

      {/* Batch Edit Dialog */}
      <Modal
        title={`批量編輯 (${selectedRowKeys.length} 項)`}
        open={batchEditModalOpen}
        onCancel={() => {
          setBatchEditModalOpen(false)
          setBatchEditData({})
        }}
        onOk={handleBatchSave}
        okText="批量保存"
        cancelText="取消"
        width={800}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">僅填寫需要批量更新的欄位，空白欄位將保持原值不變</Text>
        </div>
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>銷售狀況</Text>
              <Select
                value={batchEditData.sales_status}
                onChange={(value) => setBatchEditData(prev => ({ ...prev, sales_status: value }))}
                style={{ width: '100%', marginTop: '4px' }}
                placeholder="選擇銷售狀況"
                allowClear
              >
                <Option value="未售出">未售出</Option>
                <Option value="訂金">訂金</Option>
                <Option value="售出">售出</Option>
                <Option value="不銷售">不銷售</Option>
              </Select>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>銷售人員</Text>
              <Input
                value={batchEditData.sales_person_name || ''}
                onChange={(e) => setBatchEditData(prev => ({ ...prev, sales_person_name: e.target.value }))}
                style={{ marginTop: '4px' }}
                placeholder="輸入銷售人員姓名"
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>單價</Text>
              <Input
                value={batchEditData.unit_price || ''}
                onChange={(e) => setBatchEditData(prev => ({ ...prev, unit_price: e.target.value }))}
                style={{ marginTop: '4px' }}
                placeholder="輸入單價"
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>媒體來源</Text>
              <Input
                value={batchEditData.media_source || ''}
                onChange={(e) => setBatchEditData(prev => ({ ...prev, media_source: e.target.value }))}
                style={{ marginTop: '4px' }}
                placeholder="輸入媒體來源"
              />
            </div>
          </Col>
          <Col span={24}>
            <div style={{ marginBottom: '16px' }}>
              <Text>備註</Text>
              <TextArea
                value={batchEditData.notes || ''}
                onChange={(e) => setBatchEditData(prev => ({ ...prev, notes: e.target.value }))}
                style={{ marginTop: '4px' }}
                placeholder="輸入備註"
                rows={3}
              />
            </div>
          </Col>
        </Row>
      </Modal>

      {/* Withdraw Dialog */}
      <Modal
        title="確認退戶"
        open={!!withdrawingUnitId}
        onCancel={() => setWithdrawingUnitId(null)}
        onOk={handleWithdraw}
        okText="確認退戶"
        cancelText="取消"
        okButtonProps={{ danger: true, disabled: !withdrawReason.trim() }}
      >
        <div style={{ marginBottom: '16px' }}>
          <p>確定要將此戶進行退戶處理嗎？</p>
        </div>
        <div>
          <Text>退戶原因</Text>
          <TextArea
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            placeholder="請輸入退戶原因..."
            rows={4}
            style={{ marginTop: '4px' }}
          />
        </div>
      </Modal>
    </div>
  )
}

export default SalesControlTable