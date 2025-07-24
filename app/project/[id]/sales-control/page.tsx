'use client'

import { useState } from 'react'
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
  SearchOutlined,
  BarChartOutlined
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
import AdvancedSearch from '@/components/sales-control/AdvancedSearch'
import SalesStats from '@/components/sales-control/SalesStats'
import ImportExportTools from '@/components/sales-control/ImportExportTools'
import { useSalesControlData } from '@/hooks/useSalesControl'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

interface SalesControlData {
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

interface FilterOptions {
  building: string
  floor: string
  salesStatus: string
  salesPerson: string
  searchTerm: string
  priceRange: [number, number]
  areaRange: [number, number]
  dateRange: [any, any]
  mediaSource: string
  customChange: string
  buyer: string
}

export default function SalesControlPage() {
  const params = useParams()
  const projectId = parseInt(params.id as string)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [filters, setFilters] = useState<FilterOptions>({
    building: '',
    floor: '',
    salesStatus: '',
    salesPerson: '',
    searchTerm: '',
    priceRange: [0, 10000000],
    areaRange: [0, 200],
    dateRange: [null, null],
    mediaSource: '',
    customChange: '',
    buyer: ''
  })
  
  // 使用React Query获取销控数据
  const { data = [], isLoading, error, refetch } = useSalesControlData(projectId, filters)
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'house_no', 'area', 'unit_price', 'house_total', 'sales_status', 
    'sales_person_name', 'deposit_date', 'sign_date'
  ])
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])  
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)

  // 数据刷新函数
  const handleDataChange = () => {
    refetch()
  }



  const handleImport = async (importedData: SalesControlData[]) => {
    try {
      // 調用批量更新API
      const response = await fetch(`/api/projects/${projectId}/sales-control/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: importedData }),
      })

      if (!response.ok) {
        throw new Error('匯入失敗')
      }

      // 刷新數據
      refetch()
      message.success(`成功匯入 ${importedData.length} 條數據`)
    } catch (error) {
      console.error('匯入失敗:', error)
      message.error('匯入失敗')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }

  const handleAdvancedSearch = (searchFilters: any) => {
    setFilters(searchFilters)
  }

  const handleSearchReset = () => {
    const resetFilters: FilterOptions = {
      building: '',
      floor: '',
      salesStatus: '',
      salesPerson: '',
      searchTerm: '',
      priceRange: [0, 10000000],
      areaRange: [0, 200],
      dateRange: [null, null],
      mediaSource: '',
      customChange: '',
      buyer: ''
    }
    setFilters(resetFilters)
  }

  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    )
  }

  const availableColumns = [
    { key: 'house_no', label: '房型編號' },
    { key: 'building', label: '棟別' },
    { key: 'floor', label: '樓層' },
    { key: 'unit', label: '戶別' },
    { key: 'area', label: '坪數' },
    { key: 'unit_price', label: '每坪單價' },
    { key: 'house_total', label: '房價' },
    { key: 'total_with_parking', label: '含車位總價' },
    { key: 'base_price', label: '底價' },
    { key: 'premium_rate', label: '溢價率' },
    { key: 'sales_status', label: '銷售狀況' },
    { key: 'buyer', label: '買方姓名' },
    { key: 'sales_person_name', label: '銷售人員' },
    { key: 'deposit_date', label: '下訂日期' },
    { key: 'sign_date', label: '簽約日期' },
    { key: 'custom_change', label: '客變需求' },
    { key: 'custom_change_content', label: '客變內容' },
    { key: 'media_source', label: '媒體來源' },
    { key: 'introducer', label: '介紹人' },
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
            items={[
              {
                key: 'grid',
                label: (
                  <span>
                    <AppstoreOutlined />
                    網格視圖
                  </span>
                )
              },
              {
                key: 'table',
                label: (
                  <span>
                    <TableOutlined />
                    表視圖
                  </span>
                )
              }
            ]}
          />
        </div>
      </div>

      {/* 高级搜索组件 */}
      <AdvancedSearch
        onSearch={handleAdvancedSearch}
        onReset={handleSearchReset}
        data={data}
      />

      {/* 工具欄 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ padding: '20px' }}>
          <Title level={4} style={{ marginBottom: '8px' }}>操作工具</Title>
          <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>匯入匯出和欄位設定</Text>
          
          <Row gutter={[16, 16]}>
            {/* 匯入匯出 */}
            <Col>
              <Space wrap>
                <ImportExportTools
                   data={data}
                   onImport={handleImport}
                   projectId={projectId}
                 />
                
                <Button 
                  icon={<BarChartOutlined />}
                  onClick={() => setIsStatsModalOpen(true)}
                >
                  數據統計
                </Button>
              </Space>
            </Col>

            {/* 欄位顯示設定 */}
            {viewMode === 'table' && (
              <Col>
                <Button 
                  icon={<EyeOutlined />}
                  onClick={() => setIsColumnSettingsOpen(true)}
                >
                  欄位設定
                </Button>
              </Col>
            )}
          </Row>
        </div>
      </Card>



      {/* 欄位設定Modal */}
      <Modal
        title="欄位顯示設定"
        open={isColumnSettingsOpen}
        onCancel={() => setIsColumnSettingsOpen(false)}
        onOk={() => setIsColumnSettingsOpen(false)}
        okText="確定"
        cancelText="取消"
        width={600}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
          <Row gutter={[16, 8]}>
            {availableColumns.map((column) => (
              <Col span={12} key={column.key}>
                <div 
                   style={{ 
                     padding: '8px', 
                     borderRadius: '4px',
                     cursor: 'pointer',
                     transition: 'background-color 0.2s'
                   }}
                   onClick={() => toggleColumnVisibility(column.key)}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.backgroundColor = '#f5f5f5'
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.backgroundColor = 'transparent'
                   }}
                 >
                  <Checkbox
                    checked={visibleColumns.includes(column.key)}
                    onChange={() => toggleColumnVisibility(column.key)}
                    style={{ pointerEvents: 'none' }}
                  >
                    {column.label}
                  </Checkbox>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </Modal>

      {/* 數據統計Modal */}
      <Modal
        title="銷控數據統計分析"
        open={isStatsModalOpen}
        onCancel={() => setIsStatsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsStatsModalOpen(false)}>
            關閉
          </Button>
        ]}
        width={1200}
        style={{ top: 20 }}
      >
        <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <SalesStats projectId={projectId} />
        </div>
      </Modal>

      {/* 主要內容 */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px', flexDirection: 'column' }}>
          <Text type="danger">數據加載失敗</Text>
          <Button onClick={() => refetch()} style={{ marginTop: '16px' }}>重新加載</Button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <SalesControlGrid 
              data={data} 
              onDataChange={handleDataChange}
              projectId={projectId.toString()}
            />
          ) : (
            <SalesControlTable
              data={data}
              visibleColumns={visibleColumns}
              onDataChange={handleDataChange}
              projectId={projectId}
            />
          )}
        </>
      )}
    </div>
  )
}