'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Space,
  Tag,
  Divider,
  Collapse,
  AutoComplete,
  Slider,
  Typography
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import styles from './AdvancedSearch.module.css'

const { RangePicker } = DatePicker
const { Option } = Select
const { Text } = Typography

interface SearchFilters {
  searchTerm: string
  building: string
  floor: string
  salesStatus: string
  salesPerson: string
  priceRange: [number, number]
  areaRange: [number, number]
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null]
  mediaSource: string
  customChange: string
  buyer: string
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
  loading?: boolean
  data?: any[]
}

interface SearchSuggestion {
  value: string
  type: 'house_no' | 'buyer' | 'sales_person' | 'building'
  label: string
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onReset,
  loading = false,
  data = []
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    building: '',
    floor: '',
    salesStatus: '',
    salesPerson: '',
    priceRange: [0, 10000000],
    areaRange: [0, 200],
    dateRange: [null, null],
    mediaSource: '',
    customChange: '',
    buyer: ''
  })

  const [isExpanded, setIsExpanded] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([])
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const searchInputRef = useRef<any>(null)

  // 生成搜索建议
  useEffect(() => {
    if (data.length > 0) {
      const suggestions: SearchSuggestion[] = []
      
      // 房号建议
      const houseNos = Array.from(new Set(data.map(item => item.house_no).filter(Boolean)))
      houseNos.forEach(houseNo => {
        suggestions.push({
          value: houseNo,
          type: 'house_no',
          label: `房号: ${houseNo}`
        })
      })

      // 买方建议
      const buyers = Array.from(new Set(data.map(item => item.buyer).filter(Boolean)))
      buyers.forEach(buyer => {
        suggestions.push({
          value: buyer,
          type: 'buyer',
          label: `买方: ${buyer}`
        })
      })

      // 销售人员建议
      const salesPersons = Array.from(new Set(data.map(item => item.sales_person_name).filter(Boolean)))
      salesPersons.forEach(person => {
        suggestions.push({
          value: person,
          type: 'sales_person',
          label: `销售: ${person}`
        })
      })

      // 楼栋建议
      const buildings = Array.from(new Set(data.map(item => item.building).filter(Boolean)))
      buildings.forEach(building => {
        suggestions.push({
          value: building,
          type: 'building',
          label: `楼栋: ${building}`
        })
      })

      setSearchSuggestions(suggestions)
    }
  }, [data])

  // 更新活跃筛选器
  useEffect(() => {
    const active: string[] = []
    if (filters.building) active.push('楼栋')
    if (filters.floor) active.push('楼层')
    if (filters.salesStatus) active.push('销售状态')
    if (filters.salesPerson) active.push('销售人员')
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) active.push('价格范围')
    if (filters.areaRange[0] > 0 || filters.areaRange[1] < 200) active.push('面积范围')
    if (filters.dateRange[0] || filters.dateRange[1]) active.push('日期范围')
    if (filters.mediaSource) active.push('媒体来源')
    if (filters.customChange) active.push('客变需求')
    if (filters.buyer) active.push('买方姓名')
    
    setActiveFilters(active)
  }, [filters])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      searchTerm: '',
      building: '',
      floor: '',
      salesStatus: '',
      salesPerson: '',
      priceRange: [0, 10000000],
      areaRange: [0, 200],
      dateRange: [null, null],
      mediaSource: '',
      customChange: '',
      buyer: ''
    }
    setFilters(resetFilters)
    onReset()
  }

  const handleSearchSuggestionSelect = (value: string, option: any) => {
    const suggestion = searchSuggestions.find(s => s.value === value)
    if (suggestion) {
      switch (suggestion.type) {
        case 'house_no':
          handleFilterChange('searchTerm', value)
          break
        case 'buyer':
          handleFilterChange('buyer', value)
          break
        case 'sales_person':
          handleFilterChange('salesPerson', value)
          break
        case 'building':
          handleFilterChange('building', value)
          break
      }
    } else {
      handleFilterChange('searchTerm', value)
    }
  }

  const getSearchOptions = () => {
    if (!filters.searchTerm) return []
    
    return searchSuggestions
      .filter(suggestion => 
        suggestion.value.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        suggestion.label.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
      .slice(0, 10)
      .map(suggestion => ({
        value: suggestion.value,
        label: (
          <div className={styles.suggestionItem}>
            <Text>{suggestion.label}</Text>
          </div>
        )
      }))
  }

  return (
    <Card className={styles.searchCard}>
      <div className={styles.searchHeader}>
        <div className={styles.searchTitle}>
          <FilterOutlined className={styles.searchIcon} />
          <Text strong>高级搜索</Text>
          {activeFilters.length > 0 && (
            <div className={styles.activeFilters}>
              {activeFilters.map(filter => (
                <Tag key={filter} color="blue" className={styles.filterTag}>
                  {filter}
                </Tag>
              ))}
            </div>
          )}
        </div>
        <Button
          type="text"
          icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.expandButton}
        >
          {isExpanded ? '收起' : '展开'}
        </Button>
      </div>

      {/* 快速搜索 */}
      <div className={styles.quickSearch}>
        <AutoComplete
          ref={searchInputRef}
          value={filters.searchTerm}
          onChange={(value) => handleFilterChange('searchTerm', value)}
          onSelect={handleSearchSuggestionSelect}
          options={getSearchOptions()}
          placeholder="搜索房号、买方、销售人员..."
          className={styles.searchInput}
          allowClear
        >
          <Input
            prefix={<SearchOutlined />}
            onPressEnter={handleSearch}
          />
        </AutoComplete>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={loading}
          className={styles.searchButton}
        >
          搜索
        </Button>
        <Button
          icon={<ClearOutlined />}
          onClick={handleReset}
          className={styles.resetButton}
        >
          重置
        </Button>
      </div>

      {/* 高级筛选 */}
      {isExpanded && (
        <div className={styles.advancedFilters}>
          <Divider orientation="left">筛选条件</Divider>
          
          <Row gutter={[16, 16]}>
            {/* 基本信息筛选 */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <div className={styles.filterGroup}>
                <Text className={styles.filterLabel}>楼栋</Text>
                <Select
                  value={filters.building || undefined}
                  onChange={(value) => handleFilterChange('building', value || '')}
                  placeholder="选择楼栋"
                  allowClear
                  className={styles.filterSelect}
                >
                  <Option value="A">A栋</Option>
                  <Option value="B">B栋</Option>
                  <Option value="C">C栋</Option>
                  <Option value="D">D栋</Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <div className={styles.filterGroup}>
                <Text className={styles.filterLabel}>楼层</Text>
                <InputNumber
                  value={filters.floor ? parseInt(filters.floor) : undefined}
                  onChange={(value) => handleFilterChange('floor', value?.toString() || '')}
                  placeholder="楼层"
                  min={1}
                  max={50}
                  className={styles.filterInput}
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <div className={styles.filterGroup}>
                <Text className={styles.filterLabel}>销售状态</Text>
                <Select
                  value={filters.salesStatus || undefined}
                  onChange={(value) => handleFilterChange('salesStatus', value || '')}
                  placeholder="销售状态"
                  allowClear
                  className={styles.filterSelect}
                >
                  <Option value="售出">售出</Option>
                  <Option value="订金">订金</Option>
                  <Option value="未售出">未售出</Option>
                  <Option value="不销售">不销售</Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <div className={styles.filterGroup}>
                <Text className={styles.filterLabel}>销售人员</Text>
                <Input
                  value={filters.salesPerson}
                  onChange={(e) => handleFilterChange('salesPerson', e.target.value)}
                  placeholder="销售人员姓名"
                  allowClear
                  className={styles.filterInput}
                />
              </div>
            </Col>

            {/* 价格和面积范围 */}
            <Col xs={24} sm={12} md={12} lg={8}>
              <div className={styles.filterGroup}>
                <Text className={styles.filterLabel}>
                  价格范围: {filters.priceRange[0].toLocaleString()} - {filters.priceRange[1].toLocaleString()} 万
                </Text>
                <Slider
                  range
                  value={filters.priceRange}
                  onChange={(value) => handleFilterChange('priceRange', value)}
                  min={0}
                  max={10000000}
                  step={100000}
                  className={styles.filterSlider}
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={12} lg={8}>
              <div className={styles.filterGroup}>
                <Text className={styles.filterLabel}>
                  面积范围: {filters.areaRange[0]} - {filters.areaRange[1]} 平米
                </Text>
                <Slider
                  range
                  value={filters.areaRange}
                  onChange={(value) => handleFilterChange('areaRange', value)}
                  min={0}
                  max={200}
                  step={5}
                  className={styles.filterSlider}
                />
              </div>
            </Col>

            {/* 日期范围 */}
            <Col xs={24} sm={12} md={12} lg={8}>
              <div className={styles.filterGroup}>
                <Text className={styles.filterLabel}>日期范围</Text>
                <RangePicker
                  value={filters.dateRange}
                  onChange={(dates) => handleFilterChange('dateRange', dates)}
                  placeholder={['开始日期', '结束日期']}
                  className={styles.filterDatePicker}
                />
              </div>
            </Col>

            {/* 其他筛选 */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <div className={styles.filterGroup}>
                <Text className={styles.filterLabel}>媒体来源</Text>
                <Input
                  value={filters.mediaSource}
                  onChange={(e) => handleFilterChange('mediaSource', e.target.value)}
                  placeholder="媒体来源"
                  allowClear
                  className={styles.filterInput}
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <div className={styles.filterGroup}>
                <Text className={styles.filterLabel}>客变需求</Text>
                <Select
                  value={filters.customChange || undefined}
                  onChange={(value) => handleFilterChange('customChange', value || '')}
                  placeholder="客变需求"
                  allowClear
                  className={styles.filterSelect}
                >
                  <Option value="1">有客变</Option>
                  <Option value="0">无客变</Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <div className={styles.filterGroup}>
                <Text className={styles.filterLabel}>买方姓名</Text>
                <Input
                  value={filters.buyer}
                  onChange={(e) => handleFilterChange('buyer', e.target.value)}
                  placeholder="买方姓名"
                  allowClear
                  className={styles.filterInput}
                />
              </div>
            </Col>
          </Row>

          <div className={styles.filterActions}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
              >
                应用筛选
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={handleReset}
              >
                清除所有筛选
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Card>
  )
}

export default AdvancedSearch