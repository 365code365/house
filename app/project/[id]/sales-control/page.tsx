'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  AppstoreOutlined,
  TableOutlined,
  UploadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FilterOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Modal, 
  Tabs, 
  Typography, 
  Space, 
  Row, 
  Col, 
  Checkbox, 
  Upload,
  Spin,
  message
} from 'antd'
import SalesControlGrid from '@/components/sales-control/SalesControlGrid'
import SalesControlTable from '@/components/sales-control/SalesControlTable'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

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

interface FilterOptions {
  building: string
  floor: string
  salesStatus: string
  salesPerson: string
  searchTerm: string
}

export default function SalesControlPage() {
  const params = useParams()
  const projectId = params.id as string
  const [data, setData] = useState<SalesControlData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [filters, setFilters] = useState<FilterOptions>({
    building: '',
    floor: '',
    salesStatus: '',
    salesPerson: '',
    searchTerm: ''
  })
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'unit_number', 'area', 'unit_price', 'house_price', 'sales_status', 
    'buyer_count', 'sales_person_name', 'order_date', 'contract_date'
  ])
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])

  useEffect(() => {
    if (projectId) {
      fetchSalesControlData()
    }
  }, [projectId, filters])

  const fetchSalesControlData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/projects/${projectId}/sales-control?${params}`)
      if (response.ok) {
        const salesData = await response.json()
        setData(salesData)
      }
    } catch (error) {
      console.error('獲取銷控數據失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      const params = new URLSearchParams()
      params.append('format', format)
      params.append('viewMode', viewMode)
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/projects/${projectId}/sales-control/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `銷控表_${viewMode === 'grid' ? '網格視圖' : '表視圖'}_${new Date().toLocaleDateString('zh-TW')}.${format === 'excel' ? 'xlsx' : 'csv'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('導出失敗:', error)
      alert('導出失敗')
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      alert('請選擇要匯入的檔案')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('viewMode', viewMode)

      const response = await fetch(`/api/projects/${projectId}/sales-control/import`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setPreviewData(result.preview)
        alert('檔案匯入成功，請檢查預覽數據')
        setIsImportDialogOpen(false)
        fetchSalesControlData()
      } else {
        const error = await response.json()
        alert(error.message || '匯入失敗')
      }
    } catch (error) {
      console.error('匯入失敗:', error)
      alert('匯入失敗')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    )
  }

  const availableColumns = [
    { key: 'unit_number', label: '房型編號' },
    { key: 'building', label: '棟別' },
    { key: 'floor', label: '樓層' },
    { key: 'unit', label: '戶別' },
    { key: 'area', label: '坪數' },
    { key: 'balcony_area', label: '露臺坪數' },
    { key: 'unit_price', label: '每坪單價' },
    { key: 'house_price', label: '房價' },
    { key: 'parking_price', label: '車位價格' },
    { key: 'total_price_with_parking', label: '含車位總價' },
    { key: 'base_price', label: '底價' },
    { key: 'premium_rate', label: '溢價率' },
    { key: 'sales_status', label: '銷售狀況' },
    { key: 'buyer_count', label: '買方人數' },
    { key: 'sales_person_name', label: '銷售人員' },
    { key: 'order_date', label: '下訂日期' },
    { key: 'contract_date', label: '簽約日期' },
    { key: 'custom_requirements', label: '客變需求' },
    { key: 'custom_content', label: '客變內容' },
    { key: 'media_source', label: '媒體來源' },
    { key: 'gifts', label: '贈送' },
    { key: 'notes', label: '備註' }
  ]

  return (
    <div style={{ padding: '0' }}>
      {/* 頁面標題 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>銷控管理</Title>
          <Text type="secondary">管理房屋銷售狀況與客戶資訊</Text>
        </div>
        <div>
          <Tabs 
            activeKey={viewMode} 
            onChange={(key) => setViewMode(key as 'grid' | 'table')}
            size="large"
          >
            <TabPane 
              tab={
                <span>
                  <AppstoreOutlined />
                  網格視圖
                </span>
              } 
              key="grid" 
            />
            <TabPane 
              tab={
                <span>
                  <TableOutlined />
                  表視圖
                </span>
              } 
              key="table" 
            />
          </Tabs>
        </div>
      </div>

      {/* 工具欄 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ padding: '20px' }}>
          <Title level={4} style={{ marginBottom: '8px' }}>操作工具</Title>
          <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>匯入匯出、篩選和欄位設定</Text>
          
          <Row gutter={[16, 16]}>
            {/* 匯入匯出 */}
            <Col>
              <Space wrap>
                <Button 
                  icon={<UploadOutlined />}
                  onClick={() => setIsImportDialogOpen(true)}
                >
                  匯入Excel
                </Button>
                
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => handleExport('excel')}
                >
                  導出Excel
                </Button>
                
                {viewMode === 'table' && (
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={() => handleExport('csv')}
                  >
                    導出CSV
                  </Button>
                )}
              </Space>
            </Col>

            {/* 篩選器 */}
            <Col>
              <Space wrap>
                <Select 
                  value={filters.building || undefined}
                  placeholder="棟別"
                  style={{ width: 120 }}
                  onChange={(value) => handleFilterChange('building', value || '')}
                  allowClear
                >
                  <Option value="A">A棟</Option>
                  <Option value="B">B棟</Option>
                  <Option value="C">C棟</Option>
                </Select>

                <Select 
                  value={filters.salesStatus || undefined}
                  placeholder="銷售狀況"
                  style={{ width: 120 }}
                  onChange={(value) => handleFilterChange('salesStatus', value || '')}
                  allowClear
                >
                  <Option value="售出">售出</Option>
                  <Option value="訂金">訂金</Option>
                  <Option value="未售出">未售出</Option>
                  <Option value="不銷售">不銷售</Option>
                </Select>

                <Input
                  placeholder="搜尋房型編號..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  prefix={<SearchOutlined />}
                  style={{ width: 200 }}
                />
              </Space>
            </Col>

            {/* 欄位顯示設定 */}
            {viewMode === 'table' && (
              <Col>
                <Button 
                  icon={<EyeOutlined />}
                  onClick={() => {
                    Modal.info({
                      title: '欄位顯示設定',
                      width: 600,
                      content: (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          <Row gutter={[16, 8]}>
                            {availableColumns.map((column) => (
                              <Col span={12} key={column.key}>
                                <Checkbox
                                  checked={visibleColumns.includes(column.key)}
                                  onChange={() => toggleColumnVisibility(column.key)}
                                >
                                  {column.label}
                                </Checkbox>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      ),
                      onOk() {}
                    })
                  }}
                >
                  欄位設定
                </Button>
              </Col>
            )}
          </Row>
        </div>
      </Card>

      {/* 匯入Modal */}
      <Modal
        title="匯入Excel檔案"
        open={isImportDialogOpen}
        onCancel={() => setIsImportDialogOpen(false)}
        onOk={handleImport}
        okText="匯入"
        cancelText="取消"
      >
        <div style={{ marginBottom: '16px' }}>
          <Text>選擇檔案</Text>
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ marginTop: '8px' }}
          />
        </div>
      </Modal>

      {/* 主要內容 */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <SalesControlGrid 
              data={data} 
              onDataChange={fetchSalesControlData}
              projectId={projectId}
            />
          ) : (
            <SalesControlTable 
              data={data} 
              visibleColumns={visibleColumns}
              onDataChange={fetchSalesControlData}
              projectId={projectId}
            />
          )}
        </>
      )}
    </div>
  )
}