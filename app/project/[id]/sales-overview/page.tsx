'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, Row, Col, Statistic, Spin, Alert } from 'antd'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpOutlined, ArrowDownOutlined, HomeOutlined, DollarOutlined } from '@ant-design/icons'
import { SalesControlData } from '@/types/sales-control'

interface SalesOverviewData {
  totalUnits: number
  soldUnits: number
  salesRate: number
  totalSalesAmount: number
  statusDistribution: Array<{ name: string; value: number; color: string }>
  buildingSales: Array<{ building: string; sold: number; total: number }>
}

const COLORS = {
  sold: '#52c41a',
  reserved: '#faad14',
  available: '#1890ff',
  unavailable: '#f5222d'
}

const STATUS_COLORS = ['#52c41a', '#faad14', '#1890ff', '#f5222d']

export default function SalesOverviewPage() {
  const params = useParams()
  const projectId = params.id as string
  const [data, setData] = useState<SalesOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSalesOverviewData()
  }, [projectId])

  const fetchSalesOverviewData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/projects/${projectId}/sales-control`)
      if (!response.ok) {
        throw new Error('获取销售数据失败')
      }
      
      const salesData: SalesControlData[] = await response.json()
      const overviewData = processSalesData(salesData)
      setData(overviewData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据时发生错误')
    } finally {
      setLoading(false)
    }
  }

  const processSalesData = (salesData: SalesControlData[]): SalesOverviewData => {
    const totalUnits = salesData.length
    const soldUnits = salesData.filter(item => item.sales_status === '已售出').length
    const reservedUnits = salesData.filter(item => item.sales_status === '订金').length
    const availableUnits = salesData.filter(item => item.sales_status === '未售出').length
    const unavailableUnits = salesData.filter(item => item.sales_status === '不可售').length
    
    const salesRate = totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0
    const totalSalesAmount = salesData
      .filter(item => item.sales_status === '已售出')
      .reduce((sum, item) => sum + (parseFloat(item.total_with_parking) || 0), 0)

    // 状态分布数据
    const statusDistribution = [
      { name: '已售出', value: soldUnits, color: COLORS.sold },
      { name: '订金', value: reservedUnits, color: COLORS.reserved },
      { name: '未售出', value: availableUnits, color: COLORS.available },
      { name: '不可售', value: unavailableUnits, color: COLORS.unavailable }
    ].filter(item => item.value > 0)

    // 楼栋销售数据
    const buildingMap = new Map<string, { sold: number; total: number }>()
    salesData.forEach(item => {
      const building = item.building || '未知楼栋'
      if (!buildingMap.has(building)) {
        buildingMap.set(building, { sold: 0, total: 0 })
      }
      const buildingData = buildingMap.get(building)!
      buildingData.total++
      if (item.sales_status === '已售出') {
        buildingData.sold++
      }
    })

    const buildingSales = Array.from(buildingMap.entries())
      .map(([building, data]) => ({
        building,
        sold: data.sold,
        total: data.total
      }))
      .sort((a, b) => a.building.localeCompare(b.building))

    return {
      totalUnits,
      soldUnits,
      salesRate,
      totalSalesAmount,
      statusDistribution,
      buildingSales
    }
  }

  const formatCurrency = (amount: number) => {
    return `NT$${amount.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        className="m-4"
      />
    )
  }

  if (!data) {
    return (
      <Alert
        message="暂无数据"
        description="当前项目暂无销售数据"
        type="info"
        showIcon
        className="m-4"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">销售概况</h1>
          <p className="text-gray-600">快速查看项目销售进度与关键指标</p>
        </div>
        
        {/* 关键指标卡片 */}
        <Row gutter={[16, 24]} className="mb-8">
          <Col xs={24} sm={12} xl={6}>
            <Card 
              className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0"
              styles={{ body: { padding: '24px' } }}
            >
              <Statistic
                title="总房屋数"
                value={data.totalUnits}
                prefix={<HomeOutlined className="text-blue-500" />}
                valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }}
                suffix="套"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card 
              className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0"
              styles={{ body: { padding: '24px' } }}
            >
              <Statistic
                title="已售数量"
                value={data.soldUnits}
                prefix={<ArrowUpOutlined className="text-green-500" />}
                valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
                suffix="套"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card 
              className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0"
              styles={{ body: { padding: '24px' } }}
            >
              <Statistic
                title="销售率"
                value={data.salesRate}
                precision={1}
                valueStyle={{ 
                  color: data.salesRate >= 50 ? '#52c41a' : '#faad14', 
                  fontSize: '28px', 
                  fontWeight: 'bold' 
                }}
                prefix={data.salesRate >= 50 ? 
                  <ArrowUpOutlined className="text-green-500" /> : 
                  <ArrowDownOutlined className="text-yellow-500" />
                }
                suffix="%"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card 
              className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0"
              styles={{ body: { padding: '24px' } }}
            >
              <Statistic
                title="总销售金额"
                value={data.totalSalesAmount}
                formatter={(value) => formatCurrency(Number(value))}
                prefix={<DollarOutlined className="text-green-500" />}
                valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[24, 24]}>
          {/* 销售状态分布饼图 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-6 bg-blue-500 rounded"></div>
                  <span className="text-lg font-semibold text-gray-800">销售状态分布</span>
                </div>
              }
              className="shadow-lg border-0 h-[420px]"
              styles={{ body: { padding: '20px' } }}
            >
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}套`, '数量']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* 各楼栋销售情况柱状图 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-6 bg-green-500 rounded"></div>
                  <span className="text-lg font-semibold text-gray-800">各楼栋销售情况</span>
                </div>
              }
              className="shadow-lg border-0 h-[420px]"
              styles={{ body: { padding: '20px' } }}
            >
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.buildingSales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="building" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}套`, 
                      name === 'sold' ? '已售' : '总数'
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="total" fill="#e6f7ff" name="总数" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="sold" fill="#52c41a" name="已售" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}