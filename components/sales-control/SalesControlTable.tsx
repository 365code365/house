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
  message
} from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Text, Title } = Typography
const { Option } = Select
const { TextArea } = Input
import { formatCurrency, formatDate } from '@/lib/utils'

interface SalesControlData {
  id: number
  project_id: number
  building: string
  floor: number
  unit: string
  unit_number: string
  area: number
  balcony_area: number
  unit_price: number
  house_price: number
  parking_spaces: string[]
  parking_price: number
  total_price_with_parking: number
  base_price: number
  premium_rate: number
  sales_status: string
  buyer_count: number
  buyer_names: string
  order_date: string
  contract_date: string
  sales_person_id: number
  sales_person_name: string
  custom_requirements: boolean
  gifts: string
  notes: string
  created_at: string
  updated_at: string
}

interface SalesControlTableProps {
  data: SalesControlData[]
  visibleColumns: string[]
  onDataChange: () => void
  projectId: string
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
  projectId
}: SalesControlTableProps) {
  const [editingUnit, setEditingUnit] = useState<SalesControlData | null>(null)
  const [withdrawingUnitId, setWithdrawingUnitId] = useState<number | null>(null)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false)

  const allColumns = [
    { key: 'building', label: '棟別' },
    { key: 'floor', label: '樓層' },
    { key: 'unit_number', label: '戶號' },
    { key: 'unit', label: '戶型' },
    { key: 'area', label: '面積' },
    { key: 'unit_price', label: '單價' },
    { key: 'house_price', label: '房屋總價' },
    { key: 'parking_price', label: '車位價格' },
    { key: 'total_price_with_parking', label: '總價' },
    { key: 'sales_status', label: '銷售狀態' },
    { key: 'sales_person_name', label: '銷售人員' },
    { key: 'buyer_names', label: '客戶姓名' },
    { key: 'buyer_count', label: '買方人數' },
    { key: 'order_date', label: '下訂日期' },
    { key: 'contract_date', label: '簽約日期' },
    { key: 'gifts', label: '贈送' },
    { key: 'notes', label: '備註' },
    { key: 'actions', label: '操作' }
   ]

  const handleEdit = (unit: SalesControlData) => {
    setEditingUnit(unit)
  }

  const handleSaveEdit = () => {
    if (editingUnit) {
      // TODO: 实现编辑保存逻辑
      console.log('Saving unit:', editingUnit)
      setEditingUnit(null)
      onDataChange()
    }
  }

  const handleWithdraw = () => {
    if (withdrawingUnitId && withdrawReason.trim()) {
      // TODO: 实现撤销逻辑
      console.log('Withdrawing unit:', withdrawingUnitId, 'Reason:', withdrawReason)
      setWithdrawingUnitId(null)
      setWithdrawReason('')
      onDataChange()
    }
  }

  const toggleColumnVisibility = (columnKey: string) => {
    // TODO: 实现列显示切换逻辑
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
      dataIndex: 'unit_number',
      key: 'unit_number',
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
      render: (area: number) => `${area}坪`,
    },
    {
      title: '單價',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: '房屋總價',
      dataIndex: 'house_price',
      key: 'house_price',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: '車位價格',
      dataIndex: 'parking_price',
      key: 'parking_price',
      render: (price: number) => price ? formatCurrency(price) : '-',
    },
    {
      title: '總價',
      dataIndex: 'total_price_with_parking',
      key: 'total_price_with_parking',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: '銷售狀態',
      dataIndex: 'sales_status',
      key: 'sales_status',
      render: (status: string) => (
        <Badge color={statusColors[status as keyof typeof statusColors]}>
          {statusLabels[status as keyof typeof statusLabels]}
        </Badge>
      ),
    },
    {
      title: '銷售人員',
      dataIndex: 'sales_person_name',
      key: 'sales_person_name',
      render: (salesPerson: string) => salesPerson || '-',
    },
    {
      title: '客戶姓名',
      dataIndex: 'buyer_names',
      key: 'buyer_names',
      render: (customerName: string) => customerName || '-',
    },
    {
      title: '買方人數',
      dataIndex: 'buyer_count',
      key: 'buyer_count',
    },
    {
      title: '下訂日期',
      dataIndex: 'order_date',
      key: 'order_date',
      render: (date: string) => date ? formatDate(date) : '-',
    },
    {
      title: '簽約日期',
      dataIndex: 'contract_date',
      key: 'contract_date',
      render: (contractDate: string) => contractDate ? formatDate(contractDate) : '-',
    },
    {
      title: '贈送',
      dataIndex: 'gifts',
      key: 'gifts',
    },
    {
      title: '備註',
      dataIndex: 'notes',
      key: 'notes',
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

  return (
    <div>
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
        <Button onClick={() => setColumnSettingsOpen(true)}>
          欄位設定
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        scroll={{ x: 'max-content' }}
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
                  type="number"
                  value={editingUnit.area}
                  onChange={(e) => setEditingUnit({ ...editingUnit, area: parseFloat(e.target.value) })}
                  style={{ marginTop: '4px' }}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text>單價</Text>
                <Input
                  type="number"
                  value={editingUnit.unit_price}
                  onChange={(e) => setEditingUnit({ ...editingUnit, unit_price: parseFloat(e.target.value) })}
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
                  value={editingUnit.buyer_names || ''}
                  onChange={(e) => setEditingUnit({ ...editingUnit, buyer_names: e.target.value })}
                  style={{ marginTop: '4px' }}
                />
              </div>
            </Col>
          </Row>
        )}
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