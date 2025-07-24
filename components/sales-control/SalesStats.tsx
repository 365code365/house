'use client'

import React from 'react'
import { Card, Row, Col, Statistic, Spin, Alert } from 'antd'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { useSalesControlStats } from '@/hooks/useSalesControl'
import { formatCurrency } from '@/lib/utils'

interface SalesStatsProps {
  projectId: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

const SalesStats: React.FC<SalesStatsProps> = ({ projectId }) => {
  const { data: statsData, isLoading, error } = useSalesControlStats(projectId)

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载统计数据中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description="无法加载统计数据，请稍后重试"
        type="error"
        showIcon
      />
    )
  }

  if (!statsData) {
    return (
      <Alert
        message="暂无数据"
        description="当前项目暂无销控数据"
        type="info"
        showIcon
      />
    )
  }

  const {
    overview,
    statusDistribution,
    buildingStats,
    monthlySales,
    salesPersonStats,
    priceDistribution,
    areaDistribution
  } = statsData

  const buildingChartData = buildingStats
  const monthlyChartData = monthlySales
  const salesPersonChartData = salesPersonStats

  return (
    <div className="sales-stats">
      {/* 关键指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总房屋数"
              value={overview.totalUnits}
              suffix="套"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="销售率"
              value={overview.salesRate}
              suffix="%"
              valueStyle={{ color: overview.salesRate >= 70 ? '#3f8600' : overview.salesRate >= 50 ? '#faad14' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总销售金额"
              value={overview.totalSalesAmount}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均单价"
              value={overview.averageUnitPrice}
              formatter={(value) => formatCurrency(Number(value))}
              suffix="/坪"
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        {/* 销售状态分布饼图 */}
        <Col xs={24} lg={12}>
          <Card title="销售状态分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value}套 (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 楼栋销售情况柱状图 */}
        <Col xs={24} lg={12}>
          <Card title="各楼栋销售情况">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={buildingChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="building" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sold" stackId="a" fill="#52c41a" name="售出" />
                <Bar dataKey="deposit" stackId="a" fill="#faad14" name="訂金" />
                <Bar dataKey="available" stackId="a" fill="#d9d9d9" name="未售出" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 月度销售趋势 */}
        {monthlyChartData.length > 0 && (
          <Col xs={24}>
            <Card title="月度销售趋势">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === '销售金额') {
                        return [formatCurrency(Number(value)), name]
                      }
                      return [value, name]
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#1890ff" name="销售套数" />
                  <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#52c41a" name="销售金额" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* 销售人员业绩排行 */}
        {salesPersonChartData.length > 0 && (
          <Col xs={24}>
            <Card title="销售人员业绩排行（前10名）">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesPersonChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === '销售金额') {
                        return [formatCurrency(Number(value)), name]
                      }
                      return [value, name]
                    }}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#1890ff" name="销售金额" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}

export default SalesStats