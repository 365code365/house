'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  ResponsiveContainer 
} from 'recharts'
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  Users, 
  Building2, 
  Car, 
  DollarSign, 
  FileText 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface StatisticsData {
  salesOverview: {
    total: number
    sold: number
    reserved: number
    available: number
    notForSale: number
  }
  salesPersonnel: {
    name: string
    salesCount: number
    salesAmount: number
  }[]
  ageDistribution: {
    ageGroup: string
    count: number
  }[]
  genderDistribution: {
    gender: string
    count: number
  }[]
  purchaseTimeline: {
    date: string
    count: number
  }[]
  budgetDistribution: {
    range: string
    count: number
  }[]
  withdrawalReasons: {
    reason: string
    count: number
  }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function StatisticsPage() {
  const params = useParams()
  const projectId = params.id as string
  const [data, setData] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportType, setReportType] = useState('all')

  useEffect(() => {
    if (projectId) {
      fetchStatistics()
    }
  }, [projectId, startDate, endDate, reportType])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (reportType) params.append('type', reportType)

      const response = await fetch(`/api/projects/${projectId}/statistics?${params}`)
      if (response.ok) {
        const statisticsData = await response.json()
        setData(statisticsData)
      }
    } catch (error) {
      console.error('獲取統計數據失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (reportType) params.append('type', reportType)

      const response = await fetch(`/api/projects/${projectId}/statistics/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `統計報表_${new Date().toLocaleDateString('zh-TW')}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('導出PDF失敗:', error)
      alert('導出PDF失敗')
    }
  }

  const salesOverviewData = data ? [
    { name: '已售出', value: data.salesOverview.sold, color: '#00C49F' },
    { name: '已訂金', value: data.salesOverview.reserved, color: '#FFBB28' },
    { name: '可銷售', value: data.salesOverview.available, color: '#0088FE' },
    { name: '不銷售', value: data.salesOverview.notForSale, color: '#FF8042' }
  ] : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">載入統計數據中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">數據統計</h1>
          <p className="text-gray-600 mt-2">建案銷售數據分析與統計報表</p>
        </div>
        <Button onClick={handleExportPDF} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>導出PDF</span>
        </Button>
      </div>

      {/* 篩選條件 */}
      <Card>
        <CardHeader>
          <CardTitle>篩選條件</CardTitle>
          <CardDescription>設定統計數據的時間範圍和報表類型</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">開始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">結束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reportType">報表類型</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇報表類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部統計</SelectItem>
                  <SelectItem value="sales">銷售統計</SelectItem>
                  <SelectItem value="customer">客戶統計</SelectItem>
                  <SelectItem value="financial">財務統計</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchStatistics} className="w-full">
                更新數據
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          {/* 銷售概況 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>銷售概況</span>
                </CardTitle>
                <CardDescription>房屋銷售狀況分布</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesOverviewData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {salesOverviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>銷售人員業績</span>
                </CardTitle>
                <CardDescription>各銷售人員銷售數量統計</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.salesPersonnel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="salesCount" fill="#8884d8" name="銷售數量" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 客戶分析 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>年齡分布</span>
                </CardTitle>
                <CardDescription>客戶年齡層分析</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.ageDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ageGroup" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>性別分布</span>
                </CardTitle>
                <CardDescription>客戶性別比例</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.genderDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.genderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 購買趨勢 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>購買趨勢</span>
              </CardTitle>
              <CardDescription>每月購買數量變化</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.purchaseTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" name="購買數量" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 預算分布 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>預算分布</span>
                </CardTitle>
                <CardDescription>客戶預算區間分析</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.budgetDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>退戶原因分析</span>
                </CardTitle>
                <CardDescription>退戶原因統計</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.withdrawalReasons}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.withdrawalReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}