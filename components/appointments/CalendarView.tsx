'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Appointment {
  id: string
  project_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  start_time: string
  end_time: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  sales_id?: string
  remark?: string
  created_at: string
  updated_at: string
}

interface CalendarViewProps {
  projectId: string
  appointments: Appointment[]
  onDateClick: (date: Date) => void
  onRefresh: () => void
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-200'
}

const statusLabels = {
  PENDING: '待確認',
  CONFIRMED: '已確認',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  NO_SHOW: '未出席'
}

export default function CalendarView({ projectId, appointments, onDateClick, onRefresh }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 獲取當月的所有日期
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // 添加上個月的日期來填充第一週
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // 添加當月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }

    // 添加下個月的日期來填充最後一週
    const remainingDays = 42 - days.length // 6週 x 7天
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }

    return days
  }

  // 獲取指定日期的預約
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start_time).toISOString().split('T')[0]
      return appointmentDate === dateStr
    })
  }

  // 處理日期點擊
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateClick(date)
  }

  // 導航到上個月
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  // 導航到下個月
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // 導航到今天
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ]

  const today = new Date()
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            {currentDate.getFullYear()}年{monthNames[currentDate.getMonth()]}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              今天
            </Button>
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 週標題 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* 日曆網格 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day.date)
            const isCurrentDay = isToday(day.date)
            
            return (
              <div
                key={index}
                className={cn(
                  "min-h-[120px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
                  !day.isCurrentMonth && "bg-gray-50 text-gray-400",
                  isCurrentDay && "bg-blue-50 border-blue-300"
                )}
                onClick={() => handleDateClick(day.date)}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isCurrentDay && "text-blue-600"
                )}>
                  {day.date.getDate()}
                </div>
                
                {/* 預約列表 */}
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => {
                    const startTime = new Date(appointment.start_time)
                    const timeStr = startTime.toLocaleTimeString('zh-TW', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })
                    
                    return (
                      <div
                        key={appointment.id}
                        className={cn(
                          "text-xs p-1 rounded border truncate",
                          statusColors[appointment.status]
                        )}
                        title={`${timeStr} - ${appointment.customer_name} (${appointment.remark || ''})`}
                      >
                        <div className="font-medium">{timeStr}</div>
                        <div className="truncate">{appointment.customer_name}</div>
                        <div className="truncate text-gray-600">{appointment.remark || ''}</div>
                      </div>
                    )
                  })}
                  
                  {/* 顯示更多預約的指示器 */}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayAppointments.length - 3} 更多
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 圖例 */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded"></div>
            <span>待確認</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
            <span>已確認</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 border border-blue-300 rounded"></div>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
            <span>已取消</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}