'use client'

import { useState, useEffect, useRef } from 'react'
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
import CalendarView from '@/components/appointments/CalendarView'
import { CalendarDays, Clock, Users, Phone, Mail, MapPin, Plus, Search, Filter, Edit, Trash2, Calendar, List } from 'lucide-react'
import { toast } from 'sonner'

interface Appointment {
  id: string
  project_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  sales_id?: string
  remark?: string
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  })
  
  // 滚动位置保持
  const scrollPositionRef = useRef<number>(0)
  
  // 表單狀態
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    appointmentDate: undefined as Date | undefined,
    appointmentTime: '',
    endAppointmentDate: undefined as Date | undefined,
    endAppointmentTime: '',
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
      params.append('page', pagination.page.toString())
      params.append('pageSize', pagination.pageSize.toString())
      
      const response = await fetch(`/api/projects/${projectId}/appointments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.data || [])
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0
        }))
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
  }, [projectId, statusFilter, searchTerm, dateFilter, pagination.page, pagination.pageSize])
  
  // 處理分頁變更
  const handlePaginationChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      page,
      pageSize: pageSize || prev.pageSize
    }))
  }
  
  // 重置表單
  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      appointmentDate: undefined,
      appointmentTime: '',
      endAppointmentDate: undefined,
      endAppointmentTime: '',
      purpose: '',
      salesPerson: '',
      notes: ''
    })
    setEditingAppointment(null)
  }
  
  // 处理Dialog打开时记录滚动位置
  const handleDialogOpen = () => {
    scrollPositionRef.current = window.scrollY
    setIsDialogOpen(true)
  }
  
  // 处理Dialog关闭时恢复滚动位置
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    // 使用setTimeout确保Dialog完全关闭后再恢复滚动位置
    setTimeout(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'smooth'
      })
    }, 100)
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
        end_date: formData.endAppointmentDate?.toISOString().split('T')[0],
        end_time: formData.endAppointmentTime,
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
        handleDialogClose()
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
    
    // 安全地處理日期和時間轉換
    let appointmentDate: Date | undefined
    let appointmentTime = ''
    let endAppointmentDate: Date | undefined
    let endAppointmentTime = ''
    
    try {
      if (appointment.start_time) {
        const startTimeObj = new Date(appointment.start_time)
        if (!isNaN(startTimeObj.getTime())) {
          appointmentDate = startTimeObj
          // 提取時間部分 (HH:MM 格式)
          appointmentTime = startTimeObj.toTimeString().slice(0, 5)
        }
      }
      
      if (appointment.end_time) {
        const endTimeObj = new Date(appointment.end_time)
        if (!isNaN(endTimeObj.getTime())) {
          endAppointmentDate = endTimeObj
          // 提取時間部分 (HH:MM 格式)
          endAppointmentTime = endTimeObj.toTimeString().slice(0, 5)
        }
      }
    } catch (error) {
      console.error('日期時間轉換錯誤:', error)
      appointmentDate = undefined
      appointmentTime = ''
      endAppointmentDate = undefined
      endAppointmentTime = ''
    }
    
    setFormData({
      customerName: appointment.customer_name,
      customerPhone: appointment.customer_phone,
      customerEmail: appointment.customer_email || '',
      appointmentDate,
      appointmentTime,
      endAppointmentDate,
      endAppointmentTime,
      purpose: appointment.remark || '',
      salesPerson: appointment.sales_id || '',
      notes: appointment.remark || ''
    })
    handleDialogOpen()
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
        <div className="flex items-center gap-2">
          {/* 視圖切換按鈕 */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              列表
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              日曆
            </Button>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (open) {
              handleDialogOpen()
            } else {
              handleDialogClose()
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm()
                handleDialogOpen()
              }}>
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
                  <Label>开始預約日期 *</Label>
                  <DatePicker
                    date={formData.appointmentDate}
                    onDateChange={(date) => setFormData({ ...formData, appointmentDate: date })}
                    placeholder="選擇日期"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">开始預約時間 *</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>最晚預約日期</Label>
                  <DatePicker
                    date={formData.endAppointmentDate}
                    onDateChange={(date) => setFormData({ ...formData, endAppointmentDate: date })}
                    placeholder="選擇結束日期"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endAppointmentTime">最晚預約時間</Label>
                  <Input
                    id="endAppointmentTime"
                    type="time"
                    value={formData.endAppointmentTime}
                    onChange={(e) => setFormData({ ...formData, endAppointmentTime: e.target.value })}
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
                <Button type="button" variant="outline" onClick={handleDialogClose}>
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
      
      {/* 預約內容 - 根據視圖模式顯示 */}
       {viewMode === 'calendar' ? (
          <CalendarView
             projectId={Array.isArray(params.id) ? params.id[0] : params.id}
             appointments={appointments.map(apt => ({
               ...apt,
               status: apt.status === 'scheduled' ? 'PENDING' as const :
                      apt.status === 'completed' ? 'COMPLETED' as const :
                      apt.status === 'cancelled' ? 'CANCELLED' as const :
                      apt.status === 'no_show' ? 'NO_SHOW' as const : 'PENDING' as const,
               created_at: apt.created_at,
               updated_at: apt.updated_at
             }))}
             onDateClick={(date) => {
               setSelectedDate(date)
               setFormData(prev => ({ ...prev, appointmentDate: date }))
               handleDialogOpen()
             }}
             onRefresh={fetchAppointments}
           />
       ) : (
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
                           <div className="font-medium">{new Date(appointment.start_time).toLocaleDateString()}</div>
                           <div className="text-sm text-muted-foreground">{new Date(appointment.start_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</div>
                         </div>
                       </TableCell>
                       <TableCell>{appointment.remark || '-'}</TableCell>
                       <TableCell>{appointment.sales_id || '-'}</TableCell>
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
             
             {/* 分頁組件 */}
             <div className="flex justify-between items-center mt-4">
               <div className="text-sm text-muted-foreground">
                 顯示第 {((pagination.page - 1) * pagination.pageSize) + 1} 到 {Math.min(pagination.page * pagination.pageSize, pagination.total)} 項，共 {pagination.total} 項
               </div>
               <div className="flex items-center gap-2">
                 <Select
                   value={pagination.pageSize.toString()}
                   onValueChange={(value) => handlePaginationChange(1, parseInt(value))}
                 >
                   <SelectTrigger className="w-[100px]">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="10">10 / 頁</SelectItem>
                     <SelectItem value="20">20 / 頁</SelectItem>
                     <SelectItem value="50">50 / 頁</SelectItem>
                     <SelectItem value="100">100 / 頁</SelectItem>
                   </SelectContent>
                 </Select>
                 
                 <div className="flex items-center gap-1">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handlePaginationChange(pagination.page - 1)}
                     disabled={pagination.page <= 1}
                   >
                     上一頁
                   </Button>
                   
                   <div className="flex items-center gap-1">
                     {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.pageSize)) }, (_, i) => {
                       const pageNum = i + 1
                       return (
                         <Button
                           key={pageNum}
                           variant={pagination.page === pageNum ? "default" : "outline"}
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
           </CardContent>
         </Card>
       )}
    </div>
  )
}