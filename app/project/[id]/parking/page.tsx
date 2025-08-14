'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Car, Search, Filter } from 'lucide-react'
import { ParkingSpace } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'

interface ParkingFormData {
  spaceNumber: string
  type: string
  location: string
  price: number
  status: string
  customerName?: string
  salesPerson?: string
  contractDate?: string
}

export default function ParkingPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSpace, setEditingSpace] = useState<ParkingSpace | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  })
  const [formData, setFormData] = useState<ParkingFormData>({
    spaceNumber: '',
    type: '平面',
    location: '',
    price: 0,
    status: 'available'
  })

  // 獲取停車位數據
  const fetchParkingSpaces = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedType && selectedType !== 'all') params.append('type', selectedType)
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus)
      if (searchTerm) params.append('search', searchTerm)
      params.append('page', pagination.page.toString())
      params.append('pageSize', pagination.pageSize.toString())
      
      const response = await fetch(`/api/projects/${projectId}/parking?${params}`)
      if (response.ok) {
        const data = await response.json()
        setParkingSpaces(data.data || [])
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0
        }))
      }
    } catch (error) {
      console.error('獲取停車位數據失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParkingSpaces()
  }, [projectId, selectedType, selectedStatus, searchTerm, pagination.page, pagination.pageSize])

  // 處理分頁變更
  const handlePaginationChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      page,
      pageSize: pageSize || prev.pageSize
    }))
  }

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingSpace 
        ? `/api/projects/${projectId}/parking/${editingSpace.id}`
        : `/api/projects/${projectId}/parking`
      
      const method = editingSpace ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spaceNumber: formData.spaceNumber,
          type: formData.type,
          location: formData.location,
          price: formData.price,
          status: formData.status,
          customerName: formData.customerName || null,
          salesPerson: formData.salesPerson || null,
          contractDate: formData.contractDate || null,
        }),
      })
      
      if (response.ok) {
        fetchParkingSpaces()
        resetForm()
        setIsCreateDialogOpen(false)
        setEditingSpace(null)
      } else {
        const error = await response.json()
        alert(error.error || '操作失敗')
      }
    } catch (error) {
      console.error('提交失敗:', error)
      alert('操作失敗')
    }
  }

  // 重置表單
  const resetForm = () => {
    setFormData({
      spaceNumber: '',
      type: '平面',
      location: '',
      price: 0,
      status: 'available'
    })
  }

  // 處理編輯
  const handleEdit = (space: ParkingSpace) => {
    setEditingSpace(space)
    setFormData({
      spaceNumber: space.parkingNo,
      type: space.type || '平面',
      location: space.location || '',
      price: Number(space.price),
      status: space.salesStatus,
      customerName: space.buyer || '',
      salesPerson: space.salesId || '',
      contractDate: space.salesDate ? space.salesDate.toISOString().split('T')[0] : '',
    })
    setIsCreateDialogOpen(true)
  }

  // 處理刪除
  const handleDelete = async (spaceId: string) => {
    if (!confirm('確定要刪除這個停車位嗎？')) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/parking/${spaceId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchParkingSpaces()
      } else {
        const error = await response.json()
        alert(error.error || '刪除失敗')
      }
    } catch (error) {
      console.error('刪除失敗:', error)
      alert('刪除失敗')
    }
  }

  // 狀態顏色映射
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-blue-100 text-blue-800',
    unavailable: 'bg-gray-100 text-gray-800',
  }

  const statusLabels = {
    available: '可售',
    reserved: '預約',
    sold: '已售',
    unavailable: '不可售',
  }

  const typeLabels = {
    '平面': '平面車位',
    '機械上層': '機械上層',
    '機械中層': '機械中層',
    '機械下層': '機械下層',
    '機械平移': '機械平移',
    '機車位': '機車位',
    '腳踏車位': '腳踏車位',
    '自設': '自設車位',
    '法定': '法定車位',
  }

  // 統計數據 - 使用useMemo優化性能
  const stats = useMemo(() => ({
    total: parkingSpaces.length,
    available: parkingSpaces.filter(s => s.salesStatus === 'AVAILABLE').length,
    reserved: parkingSpaces.filter(s => s.salesStatus === 'DEPOSIT').length,
    sold: parkingSpaces.filter(s => s.salesStatus === 'SOLD').length,
    totalRevenue: parkingSpaces
      .filter(s => s.salesStatus === 'SOLD')
      .reduce((sum, s) => sum + Number(s.price), 0),
  }), [parkingSpaces])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">載入中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">停車位管理</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingSpace(null) }}>
              <Plus className="h-4 w-4 mr-2" />
              新增停車位
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSpace ? '編輯停車位' : '新增停車位'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="spaceNumber">車位編號</Label>
                <Input
                  id="spaceNumber"
                  value={formData.spaceNumber}
                  onChange={(e) => setFormData({ ...formData, spaceNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">車位類型</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="平面">平面車位</SelectItem>
                    <SelectItem value="機械上層">機械上層</SelectItem>
                    <SelectItem value="機械中層">機械中層</SelectItem>
                    <SelectItem value="機械下層">機械下層</SelectItem>
                    <SelectItem value="機械平移">機械平移</SelectItem>
                    <SelectItem value="機車位">機車位</SelectItem>
                    <SelectItem value="腳踏車位">腳踏車位</SelectItem>
                    <SelectItem value="自設">自設車位</SelectItem>
                    <SelectItem value="法定">法定車位</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">位置</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="例：B1-01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">價格</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">狀態</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">可售</SelectItem>
                    <SelectItem value="reserved">預約</SelectItem>
                    <SelectItem value="sold">已售</SelectItem>
                    <SelectItem value="unavailable">不可售</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.status === 'reserved' || formData.status === 'sold') && (
                <>
                  <div>
                    <Label htmlFor="customerName">客戶姓名</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName || ''}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salesPerson">銷售人員</Label>
                    <Input
                      id="salesPerson"
                      value={formData.salesPerson || ''}
                      onChange={(e) => setFormData({ ...formData, salesPerson: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractDate">合約日期</Label>
                    <Input
                      id="contractDate"
                      type="date"
                      value={formData.contractDate || ''}
                      onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  {editingSpace ? '更新' : '創建'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總車位數</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可售</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">預約</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已售</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 篩選和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索車位編號、位置..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇車位類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  <SelectItem value="平面">平面車位</SelectItem>
                  <SelectItem value="機械上層">機械上層</SelectItem>
                  <SelectItem value="機械中層">機械中層</SelectItem>
                  <SelectItem value="機械下層">機械下層</SelectItem>
                  <SelectItem value="機械平移">機械平移</SelectItem>
                  <SelectItem value="機車位">機車位</SelectItem>
                  <SelectItem value="腳踏車位">腳踏車位</SelectItem>
                  <SelectItem value="自設">自設車位</SelectItem>
                  <SelectItem value="法定">法定車位</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="available">可售</SelectItem>
                  <SelectItem value="reserved">預約</SelectItem>
                  <SelectItem value="sold">已售</SelectItem>
                  <SelectItem value="unavailable">不可售</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 停車位列表 */}
      <Card>
        <CardHeader>
          <CardTitle>停車位列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>車位編號</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>價格</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>客戶姓名</TableHead>
                  <TableHead>銷售人員</TableHead>
                  <TableHead>合約日期</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parkingSpaces.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell className="font-medium">{space.parkingNo}</TableCell>
                    <TableCell>{typeLabels[space.type as keyof typeof typeLabels]}</TableCell>
                    <TableCell>{space.location}</TableCell>
                    <TableCell>{formatCurrency(Number(space.price))}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[space.salesStatus as keyof typeof statusColors]}>
                          {statusLabels[space.salesStatus as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>{space.buyer || '-'}</TableCell>
                <TableCell>{space.salesId || '-'}</TableCell>
                <TableCell>
                  {space.salesDate ? new Date(space.salesDate).toLocaleDateString('zh-TW') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(space)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(space.id.toString())}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {parkingSpaces.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暫無停車位數據
            </div>
          )}
          {/* 分頁組件 */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                顯示第 {((pagination.page - 1) * pagination.pageSize) + 1} 到{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} 項，
                共 {pagination.total} 項
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">每頁顯示</span>
                  <Select
                    value={pagination.pageSize.toString()}
                    onValueChange={(value) => handlePaginationChange(1, parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">項</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaginationChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    上一頁
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.pageSize)) }, (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i
                      if (pageNum > Math.ceil(pagination.total / pagination.pageSize)) return null
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePaginationChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaginationChange(pagination.page + 1)}
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                  >
                    下一頁
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}