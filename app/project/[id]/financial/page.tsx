'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, Row, Col, Statistic, Table, DatePicker, Select, Button, Space } from 'antd'
import { DollarOutlined, RiseOutlined, FallOutlined, PieChartOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

interface FinancialStats {
  totalBudget: number
  totalExpense: number
  totalCommission: number
  totalDeposit: number
  budgetUtilization: number
  monthlyExpense: number
}

interface ExpenseData {
  month: string
  budget: number
  expense: number
}

interface CategoryData {
  category: string
  amount: number
}

export default function FinancialPage() {
  const params = useParams()
  const projectId = params.id as string
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<FinancialStats>({
    totalBudget: 910500600,
    totalExpense: 810500600,
    totalCommission: 666666000,
    totalDeposit: 500000000,
    budgetUtilization: 89.0,
    monthlyExpense: 45000000
  })
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(11, 'month').startOf('month'),
    dayjs().endOf('month')
  ])
  const [selectedYear, setSelectedYear] = useState(2025)

  // 模拟数据
  const expenseData: ExpenseData[] = [
    { month: '1月', budget: 80000000, expense: 75000000 },
    { month: '2月', budget: 75000000, expense: 70000000 },
    { month: '3月', budget: 85000000, expense: 80000000 },
    { month: '4月', budget: 90000000, expense: 85000000 },
    { month: '5月', budget: 95000000, expense: 90000000 },
    { month: '6月', budget: 88000000, expense: 82000000 },
    { month: '7月', budget: 92000000, expense: 88000000 },
    { month: '8月', budget: 87000000, expense: 83000000 },
    { month: '9月', budget: 91000000, expense: 86000000 },
    { month: '10月', budget: 89000000, expense: 84000000 },
    { month: '11月', budget: 93000000, expense: 89000000 },
    { month: '12月', budget: 96000000, expense: 91000000 }
  ]

  const categoryData: CategoryData[] = [
    { category: '網路廣告', amount: 150000000 },
    { category: '平面印刷', amount: 120000000 },
    { category: '戶外廣告', amount: 100000000 },
    { category: '業務推廣', amount: 80000000 },
    { category: '人員薪資', amount: 200000000 },
    { category: '其他支出', amount: 160500600 }
  ]

  const detailData = [
    {
      key: '1',
      category: '網路廣告',
      budget: 150000000,
      expense: 140000000,
      utilization: '93%',
      status: '執行中'
    },
    {
      key: '2',
      category: '平面印刷',
      budget: 120000000,
      expense: 115000000,
      utilization: '96%',
      status: '執行中'
    },
    {
      key: '3',
      category: '戶外廣告',
      budget: 100000000,
      expense: 95000000,
      utilization: '95%',
      status: '執行中'
    },
    {
      key: '4',
      category: '業務推廣',
      budget: 80000000,
      expense: 75000000,
      utilization: '94%',
      status: '執行中'
    },
    {
      key: '5',
      category: '人員薪資',
      budget: 200000000,
      expense: 190000000,
      utilization: '95%',
      status: '執行中'
    },
    {
      key: '6',
      category: '其他支出',
      budget: 160500600,
      expense: 150500600,
      utilization: '94%',
      status: '執行中'
    }
  ]

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [projectId])

  // 图表配置将在后续添加图表库后实现

  const columns = [
    {
      title: '類別',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '預算金額',
      dataIndex: 'budget',
      key: 'budget',
      render: (value: number) => `${(value / 10000).toLocaleString()} 萬`,
    },
    {
      title: '實際支出',
      dataIndex: 'expense',
      key: 'expense',
      render: (value: number) => `${(value / 10000).toLocaleString()} 萬`,
    },
    {
      title: '執行率',
      dataIndex: 'utilization',
      key: 'utilization',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">財務總覽</h1>
        <p className="text-gray-600">資料來源為預算規劃與支出管理表單</p>
      </div>

      {/* 筛选工具栏 */}
      <div className="mb-6">
        <Space>
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            style={{ width: 120 }}
          >
            <Option value={2023}>2023</Option>
            <Option value={2024}>2024</Option>
            <Option value={2025}>2025</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            format="YYYY/MM/DD"
          />
          <Button type="primary">查詢</Button>
          <Button>匯出</Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="預算總額"
              value={stats.totalBudget / 10000}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
              suffix="萬"
            />
            <div className="text-sm text-gray-500 mt-2">
              較上月 +5.2%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="實際支出"
              value={stats.totalExpense / 10000}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<RiseOutlined />}
              suffix="萬"
            />
            <div className="text-sm text-gray-500 mt-2">
              執行率 {stats.budgetUtilization}%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="預算執行率"
              value={stats.budgetUtilization}
              precision={1}
              valueStyle={{ color: '#faad14' }}
              prefix={<PieChartOutlined />}
              suffix="%"
            />
            <div className="text-sm text-gray-500 mt-2">
              目標 85%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="請傭總額"
              value={stats.totalCommission / 10000}
              precision={0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<FallOutlined />}
              suffix="萬"
            />
            <div className="text-sm text-gray-500 mt-2">
              較上月 +8.1%
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card title="月度預算與支出趨勢" className="h-96">
            <div className="flex items-center justify-center h-64 text-gray-500">
              圖表功能開發中...
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="支出類別分布" className="h-96">
            <div className="flex items-center justify-center h-64 text-gray-500">
              圖表功能開發中...
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详细数据表格 */}
      <Card title="預算執行明細">
        <Table
          columns={columns}
          dataSource={detailData}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
        />
      </Card>
    </div>
  )
}