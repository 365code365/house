'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Clock, Users, Phone, Mail, MapPin, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Appointment {
  id: string
  project_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  date: string
  time: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  purpose: string
  sales_person?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface AppointmentStats {
  total: number
  scheduled: number
  completed: number
  cancelled: number
  noShow: number
  todayAppointments: number
  upcomingAppointments: number
}

const statusLabels = {
  scheduled: '已預約',
  completed: '已完成',
  cancelled: '已取消',
  no_show: '未出席'
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800'
}

export default function AppointmentsPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<AppointmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<Date | undefined>()
  
  // 表單狀態
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    appointmentDate: undefined as Date | undefined,
    appointmentTime: '',
    purpose: '',
    salesPerson: '',
    notes: ''
  })
  
  // 獲取預約數據
  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      if (dateFilter) params.append('date', dateFilter.toISOString().split('T')[0])
      
      const response = await fetch(`/api/projects/${projectId}/appointments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      } else {
        toast.error('獲取預約數據失敗')
      }
    } catch (error) {
      console.error('獲取預約數據失敗:', error)
      toast.error('獲取預約數據失敗')
    }
  }
  
  // 獲取統計數據
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/appointments/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('獲取統計數據失敗:', error)
    }
  }
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchAppointments(), fetchStats()])
      setLoading(false)
    }
    
    loadData()
  }, [projectId, statusFilter, searchTerm, dateFilter])
  
  // 重置表單
  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      appointmentDate: undefined,
      appointmentTime: '',
      purpose: '',
      salesPerson: '',
      notes: ''
    })
    setEditingAppointment(null)
  }
  
  // 處理新增/編輯預約
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerName || !formData.customerPhone || !formData.appointmentDate || !formData.appointmentTime || !formData.purpose) {
      toast.error('請填寫所有必填字段')
      return
    }
    
    try {
      const appointmentData = {
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_email: formData.customerEmail,
        date: formData.appointmentDate?.toISOString().split('T')[0],
        time: formData.appointmentTime,
        purpose: formData.purpose,
        sales_person: formData.salesPerson,
        notes: formData.notes
      }
      
      const url = editingAppointment 
        ? `/api/projects/${projectId}/appointments/${editingAppointment.id}`
        : `/api/projects/${projectId}/appointments`
      
      const method = editingAppointment ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })
      
      if (response.ok) {
        toast.success(editingAppointment ? '預約更新成功' : '預約創建成功')
        setIsDialogOpen(false)
        resetForm()
        fetchAppointments()
        fetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || '操作失敗')
      }
    } catch (error) {
      console.error('操作失敗:', error)
      toast.error('操作失敗')
    }
  }
  
  // 處理編輯
  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    
    // 安全地處理日期轉換
    let appointmentDate: Date | undefined
    try {
      if (appointment.date) {
        const dateObj = new Date(appointment.date)
        appointmentDate = isNaN(dateObj.getTime()) ? undefined : dateObj
      }
    } catch (error) {
      console.error('日期轉換錯誤:', error)
      appointmentDate = undefined
    }
    
    setFormData({
      customerName: appointment.customer_name,
      customerPhone: appointment.customer_phone,
      customerEmail: appointment.customer_email || '',
      appointmentDate,
      appointmentTime: appointment.time,
      purpose: appointment.purpose,
      salesPerson: appointment.sales_person || '',
      notes: appointment.notes || ''
    })
    setIsDialogOpen(true)
  }
  
  // 處理刪除
  const handleDelete = async (appointmentId: string) => {
    if (!confirm('確定要刪除這個預約嗎？')) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/appointments/${appointmentId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast.success('預約刪除成功')
        fetchAppointments()
        fetchStats()
      } else {
        toast.error('刪除失敗')
      }
    } catch (error) {
      console.error('刪除失敗:', error)
      toast.error('刪除失敗')
    }
  }
  
  // 更新預約狀態
  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      
      if (response.ok) {
        toast.success('狀態更新成功')
        fetchAppointments()
        fetchStats()
      } else {
        toast.error('狀態更新失敗')
      }
    } catch (error) {
      console.error('狀態更新失敗:', error)
      toast.error('狀態更新失敗')
    }
  }
  
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">預約管理</h1>
          <p className="text-muted-foreground">管理客戶預約和參觀安排</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              新增預約
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAppointment ? '編輯預約' : '新增預約'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">客戶姓名 *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">聯絡電話 *</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerEmail">電子郵件</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>預約日期 *</Label>
                  <DatePicker
                    date={formData.appointmentDate}
                    onDateChange={(date) => setFormData({ ...formData, appointmentDate: date })}
                    placeholder="選擇日期"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">預約時間 *</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purpose">預約目的 *</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="例如：看房、簽約、諮詢等"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="salesPerson">負責業務</Label>
                <Input
                  id="salesPerson"
                  value={formData.salesPerson}
                  onChange={(e) => setFormData({ ...formData, salesPerson: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">備註</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  {editingAppointment ? '更新' : '創建'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* 統計卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總預約數</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日預約</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">即將到來</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">完成率</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 篩選工具欄 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜尋客戶姓名、電話或預約目的..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="篩選狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有狀態</SelectItem>
            <SelectItem value="scheduled">已預約</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
            <SelectItem value="no_show">未出席</SelectItem>
          </SelectContent>
        </Select>
        
        <DatePicker
          date={dateFilter}
          onDateChange={setDateFilter}
          placeholder="篩選日期"
        />
        
        {(statusFilter !== 'all' || searchTerm || dateFilter) && (
          <Button
            variant="outline"
            onClick={() => {
              setStatusFilter('all')
              setSearchTerm('')
              setDateFilter(undefined)
            }}
          >
            清除篩選
          </Button>
        )}
      </div>
      
      {/* 預約列表 */}
      <Card>
        <CardHeader>
          <CardTitle>預約列表</CardTitle>
          <CardDescription>管理所有客戶預約記錄</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客戶資訊</TableHead>
                <TableHead>預約時間</TableHead>
                <TableHead>預約目的</TableHead>
                <TableHead>負責業務</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    暫無預約記錄
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{appointment.customer_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {appointment.customer_phone}
                        </div>
                        {appointment.customer_email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {appointment.customer_email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{appointment.date}</div>
                        <div className="text-sm text-muted-foreground">{appointment.time}</div>
                      </div>
                    </TableCell>
                    <TableCell>{appointment.purpose}</TableCell>
                    <TableCell>{appointment.sales_person || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[appointment.status]}>
                          {statusLabels[appointment.status]}
                        </Badge>
                        <Select
                          value={appointment.status}
                          onValueChange={(value) => updateAppointmentStatus(appointment.id, value)}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">已預約</SelectItem>
                            <SelectItem value="completed">已完成</SelectItem>
                            <SelectItem value="cancelled">已取消</SelectItem>
                            <SelectItem value="no_show">未出席</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(appointment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(appointment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}