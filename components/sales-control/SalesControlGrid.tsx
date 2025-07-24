'use client'

import { useState } from 'react'
import { 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  DollarOutlined, 
  HomeOutlined 
} from '@ant-design/icons'
import { 
  Card, 
  Button, 
  Badge, 
  Modal, 
  Input, 
  Select, 
  Typography, 
  Row, 
  Col, 
  Space,
  message
} from 'antd'
import { formatCurrency, formatDate } from '@/lib/utils'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

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
  custom_content: string
  gifts: string
  notes: string
  media_source: string
  created_at: string
  updated_at: string
}

interface SalesControlGridProps {
  data: SalesControlData[]
  onDataChange: () => void
  projectId: string
}

const statusColors = {
  '售出': 'success',
  '訂金': 'warning',
  '未售出': 'default',
  '不銷售': 'error'
} as const

export default function SalesControlGrid({ data, onDataChange, projectId }: SalesControlGridProps) {
  const [selectedUnit, setSelectedUnit] = useState<SalesControlData | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [editData, setEditData] = useState<Partial<SalesControlData>>({})

  // 按樓層分組數據
  const groupedData = data.reduce((acc, item) => {
    const key = `${item.building}-${item.floor}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {} as Record<string, SalesControlData[]>)

  const handleEdit = (unit: SalesControlData) => {
    setSelectedUnit(unit)
    setEditData(unit)
    setIsEditDialogOpen(true)
  }

  const handleWithdraw = (unit: SalesControlData) => {
    setSelectedUnit(unit)
    setIsWithdrawDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedUnit) return

    try {
      const response = await fetch(`/api/projects/${projectId}/sales-control/${selectedUnit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        setSelectedUnit(null)
        setEditData({})
        onDataChange()
      } else {
        const error = await response.json()
        alert(error.message || '更新失敗')
      }
    } catch (error) {
      console.error('更新失敗:', error)
      alert('更新失敗')
    }
  }

  const handleConfirmWithdraw = async () => {
    if (!selectedUnit) return

    try {
      const response = await fetch(`/api/projects/${projectId}/sales-control/${selectedUnit.id}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setIsWithdrawDialogOpen(false)
        setSelectedUnit(null)
        onDataChange()
        alert('退戶處理完成')
      } else {
        const error = await response.json()
        alert(error.message || '退戶處理失敗')
      }
    } catch (error) {
      console.error('退戶處理失敗:', error)
      alert('退戶處理失敗')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {Object.entries(groupedData).map(([floorKey, units]) => {
        const [building, floor] = floorKey.split('-')
        return (
          <Card key={floorKey}>
            <Card.Meta
              title={
                <Space>
                  <HomeOutlined />
                  <span>{building}棟 {floor}樓</span>
                  <Badge count={units.length} showZero color="blue" />
                </Space>
              }
            />
            <div style={{ marginTop: '16px' }}>
              <Row gutter={[16, 16]}>
                {units.map((unit) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={unit.id}>
                    <Card 
                      hoverable
                      style={{ height: '100%' }}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Title level={4} style={{ margin: 0 }}>{unit.unit_number}</Title>
                            <Text type="secondary">{unit.unit}戶</Text>
                          </div>
                          <Badge 
                            status={statusColors[unit.sales_status as keyof typeof statusColors]} 
                            text={unit.sales_status}
                          />
                        </div>
                      }
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* 基本資訊 */}
                        <Row gutter={[8, 8]}>
                          <Col span={12}>
                            <Text type="secondary">坪數: </Text>
                            <Text strong>{unit.area}坪</Text>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">單價: </Text>
                            <Text strong>{formatCurrency(unit.unit_price)}萬</Text>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">房價: </Text>
                            <Text strong>{formatCurrency(unit.house_price)}萬</Text>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">總價: </Text>
                            <Text strong>{formatCurrency(unit.total_price_with_parking)}萬</Text>
                          </Col>
                        </Row>

                        {/* 買方資訊 */}
                        {unit.buyer_names && (
                          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Space>
                                <UserOutlined style={{ color: '#999' }} />
                                <Text strong>{unit.buyer_names}</Text>
                              </Space>
                              {unit.sales_status === '售出' && (
                                <Button
                                  size="small"
                                  danger
                                  onClick={() => handleWithdraw(unit)}
                                >
                                  退戶
                                </Button>
                              )}
                            </div>
                            {unit.buyer_count > 0 && (
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                買方人數: {unit.buyer_count}人
                              </Text>
                            )}
                          </div>
                        )}

                        {/* 銷售資訊 */}
                        {unit.sales_person_name && (
                          <div>
                            <Text type="secondary">銷售: </Text>
                            <Text>{unit.sales_person_name}</Text>
                          </div>
                        )}

                        {/* 日期資訊 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {unit.order_date && (
                            <Space size="small">
                              <CalendarOutlined style={{ fontSize: '12px', color: '#999' }} />
                              <Text type="secondary" style={{ fontSize: '12px' }}>下訂: {formatDate(unit.order_date)}</Text>
                            </Space>
                          )}
                          {unit.contract_date && (
                            <Space size="small">
                              <CalendarOutlined style={{ fontSize: '12px', color: '#999' }} />
                              <Text type="secondary" style={{ fontSize: '12px' }}>簽約: {formatDate(unit.contract_date)}</Text>
                            </Space>
                          )}
                        </div>

                        {/* 停車位 */}
                        {unit.parking_spaces && unit.parking_spaces.length > 0 && (
                          <div>
                            <Text type="secondary">車位: </Text>
                            <Text>{unit.parking_spaces.join(', ')}</Text>
                          </div>
                        )}

                        {/* 操作按鈕 */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(unit)}
                          >
                            編輯
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        )
      })}

      {/* 編輯對話框 */}
      <Modal
        title={`編輯房屋資訊 - ${selectedUnit?.unit_number}`}
        open={isEditDialogOpen}
        onCancel={() => setIsEditDialogOpen(false)}
        onOk={handleSaveEdit}
        okText="儲存"
        cancelText="取消"
        width={800}
        style={{ maxHeight: '80vh' }}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>坪數</Text>
              <Input
                type="number"
                value={editData.area || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, area: parseFloat(e.target.value) }))}
                style={{ marginTop: '4px' }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>露臺坪數</Text>
              <Input
                type="number"
                value={editData.balcony_area || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, balcony_area: parseFloat(e.target.value) }))}
                style={{ marginTop: '4px' }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>每坪單價(萬元)</Text>
              <Input
                type="number"
                value={editData.unit_price || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) }))}
                style={{ marginTop: '4px' }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>房價(萬元)</Text>
              <Input
                type="number"
                value={editData.house_price || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, house_price: parseFloat(e.target.value) }))}
                style={{ marginTop: '4px' }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>底價(萬元)</Text>
              <Input
                type="number"
                value={editData.base_price || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, base_price: parseFloat(e.target.value) }))}
                style={{ marginTop: '4px' }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>買方人數</Text>
              <Select 
                value={editData.buyer_count?.toString() || undefined}
                placeholder="選擇人數"
                onChange={(value) => setEditData(prev => ({ ...prev, buyer_count: parseInt(value) }))}
                style={{ width: '100%', marginTop: '4px' }}
              >
                {[0, 1, 2, 3, 4, 5].map(num => (
                  <Option key={num} value={num.toString()}>{num}人</Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>下訂日期</Text>
              <Input
                type="date"
                value={editData.order_date || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, order_date: e.target.value }))}
                style={{ marginTop: '4px' }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text>簽約日期</Text>
              <Input
                type="date"
                value={editData.contract_date || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, contract_date: e.target.value }))}
                style={{ marginTop: '4px' }}
              />
            </div>
          </Col>
          <Col span={24}>
            <div style={{ marginBottom: '16px' }}>
              <Text>贈送</Text>
              <TextArea
                value={editData.gifts || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, gifts: e.target.value }))}
                rows={2}
                style={{ marginTop: '4px' }}
              />
            </div>
          </Col>
          <Col span={24}>
            <div style={{ marginBottom: '16px' }}>
              <Text>備註</Text>
              <TextArea
                value={editData.notes || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                style={{ marginTop: '4px' }}
              />
            </div>
          </Col>
        </Row>
      </Modal>

      {/* 退戶確認對話框 */}
      <Modal
        title="確認退戶"
        open={isWithdrawDialogOpen}
        onCancel={() => setIsWithdrawDialogOpen(false)}
        onOk={handleConfirmWithdraw}
        okText="確認退戶"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div style={{ padding: '16px 0' }}>
          <p>確定要將 <Text strong>{selectedUnit?.unit_number}</Text> 進行退戶處理嗎？</p>
          <Text type="secondary" style={{ fontSize: '14px', marginTop: '8px', display: 'block' }}>
            退戶後該戶將恢復為未售出狀態，相關資料將移至退戶記錄。
          </Text>
        </div>
      </Modal>
    </div>
  )
}