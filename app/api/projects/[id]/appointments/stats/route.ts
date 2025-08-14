import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

// GET - 獲取預約統計數據
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    
    // 驗證項目是否存在
    const projectExists = await executeQuery(
      'SELECT id FROM project WHERE id = ?',
      [projectId]
    )
    
    if (!Array.isArray(projectExists) || projectExists.length === 0) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 獲取基本統計數據
    const basicStatsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = '待確認' THEN 1 END) as pending,
        COUNT(CASE WHEN status = '已確認' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = '已完成' THEN 1 END) as completed,
        COUNT(CASE WHEN status = '已取消' THEN 1 END) as cancelled
      FROM customer_appointment 
      WHERE project_id = ?
    `
    
    const basicStatsResult = await executeQuery(basicStatsQuery, [projectId])
    const basicStats = Array.isArray(basicStatsResult) ? basicStatsResult[0] as any : basicStatsResult as any
    
    // 獲取今日預約數
    const todayAppointmentsQuery = `
      SELECT COUNT(*) as count
      FROM customer_appointment 
      WHERE project_id = ? AND DATE(start_time) = CURDATE() AND status != '已取消'
    `
    
    const todayResult = await executeQuery(todayAppointmentsQuery, [projectId])
    const todayCount = Array.isArray(todayResult) ? todayResult[0] as any : todayResult as any
    
    // 獲取即將到來的預約數（未來7天）
    const upcomingAppointmentsQuery = `
      SELECT COUNT(*) as count
      FROM customer_appointment 
      WHERE project_id = ? 
        AND DATE(start_time) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND status = '待確認'
    `
    
    const upcomingResult = await executeQuery(upcomingAppointmentsQuery, [projectId])
    const upcomingCount = Array.isArray(upcomingResult) ? upcomingResult[0] as any : upcomingResult as any
    
    // 獲取按月份分組的預約趨勢（過去12個月）
    const monthlyTrendQuery = `
      SELECT 
        DATE_FORMAT(start_time, '%Y-%m') as month,
        COUNT(*) as total,
        COUNT(CASE WHEN status = '已完成' THEN 1 END) as completed,
        COUNT(CASE WHEN status = '已取消' THEN 1 END) as cancelled
      FROM customer_appointment 
      WHERE project_id = ? 
        AND start_time >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(start_time, '%Y-%m')
      ORDER BY month
    `
    
    const monthlyTrend = await executeQuery(monthlyTrendQuery, [projectId])
    
    // 獲取按備註分組的統計
    const remarkStatsQuery = `
      SELECT 
        remark,
        COUNT(*) as count,
        COUNT(CASE WHEN status = '已完成' THEN 1 END) as completed
      FROM customer_appointment 
      WHERE project_id = ? AND remark IS NOT NULL AND remark != ''
      GROUP BY remark
      ORDER BY count DESC
      LIMIT 10
    `
    
    const remarkStats = await executeQuery(remarkStatsQuery, [projectId])
    
    // 獲取按業務人員分組的統計
    const salesPersonStatsQuery = `
      SELECT 
        sales_id,
        COUNT(*) as total,
        COUNT(CASE WHEN status = '已完成' THEN 1 END) as completed,
        COUNT(CASE WHEN status = '已取消' THEN 1 END) as cancelled
      FROM customer_appointment 
      WHERE project_id = ? AND sales_id IS NOT NULL AND sales_id != ''
      GROUP BY sales_id
      ORDER BY total DESC
    `
    
    const salesPersonStats = await executeQuery(salesPersonStatsQuery, [projectId])
    
    // 獲取按時間段分組的統計
    const timeSlotStatsQuery = `
      SELECT 
        CASE 
          WHEN TIME(start_time) BETWEEN '09:00:00' AND '11:59:59' THEN '上午 (09:00-12:00)'
          WHEN TIME(start_time) BETWEEN '12:00:00' AND '13:59:59' THEN '中午 (12:00-14:00)'
          WHEN TIME(start_time) BETWEEN '14:00:00' AND '17:59:59' THEN '下午 (14:00-18:00)'
          WHEN TIME(start_time) BETWEEN '18:00:00' AND '20:59:59' THEN '晚上 (18:00-21:00)'
          ELSE '其他時間'
        END as timeSlot,
        COUNT(*) as count
      FROM customer_appointment 
      WHERE project_id = ?
      GROUP BY 
        CASE 
          WHEN TIME(start_time) BETWEEN '09:00:00' AND '11:59:59' THEN '上午 (09:00-12:00)'
          WHEN TIME(start_time) BETWEEN '12:00:00' AND '13:59:59' THEN '中午 (12:00-14:00)'
          WHEN TIME(start_time) BETWEEN '14:00:00' AND '17:59:59' THEN '下午 (14:00-18:00)'
          WHEN TIME(start_time) BETWEEN '18:00:00' AND '20:59:59' THEN '晚上 (18:00-21:00)'
          ELSE '其他時間'
        END
      ORDER BY MIN(TIME(start_time))
    `
    
    const timeSlotStats = await executeQuery(timeSlotStatsQuery, [projectId])
    
    // 獲取按星期分組的統計
    const weekdayStatsQuery = `
      SELECT 
        CASE DAYOFWEEK(start_time)
          WHEN 1 THEN '星期日'
          WHEN 2 THEN '星期一'
          WHEN 3 THEN '星期二'
          WHEN 4 THEN '星期三'
          WHEN 5 THEN '星期四'
          WHEN 6 THEN '星期五'
          WHEN 7 THEN '星期六'
        END as weekday,
        COUNT(*) as count
      FROM customer_appointment 
      WHERE project_id = ?
      GROUP BY 
        CASE DAYOFWEEK(start_time)
          WHEN 1 THEN '星期日'
          WHEN 2 THEN '星期一'
          WHEN 3 THEN '星期二'
          WHEN 4 THEN '星期三'
          WHEN 5 THEN '星期四'
          WHEN 6 THEN '星期五'
          WHEN 7 THEN '星期六'
        END
      ORDER BY MIN(DAYOFWEEK(start_time))
    `
    
    const weekdayStats = await executeQuery(weekdayStatsQuery, [projectId])
    
    const response = {
      total: Number(basicStats.total) || 0,
      pending: Number(basicStats.pending) || 0,
      confirmed: Number(basicStats.confirmed) || 0,
      completed: Number(basicStats.completed) || 0,
      cancelled: Number(basicStats.cancelled) || 0,
      todayAppointments: Number(todayCount.count) || 0,
      upcomingAppointments: Number(upcomingCount.count) || 0,
      completionRate: basicStats.total > 0 ? 
        ((Number(basicStats.completed) / Number(basicStats.total)) * 100).toFixed(2) : '0.00',
      monthlyTrend: Array.isArray(monthlyTrend) ? monthlyTrend.map((item: any) => ({
        month: item.month,
        total: Number(item.total),
        completed: Number(item.completed),
        cancelled: Number(item.cancelled)
      })) : [],
      remarkStats: Array.isArray(remarkStats) ? remarkStats.map((item: any) => ({
        remark: item.remark,
        count: Number(item.count),
        completed: Number(item.completed),
        completionRate: item.count > 0 ? 
          ((Number(item.completed) / Number(item.count)) * 100).toFixed(2) : '0.00'
      })) : [],
      salesPersonStats: Array.isArray(salesPersonStats) ? salesPersonStats.map((item: any) => ({
        salesId: item.sales_id,
        total: Number(item.total),
        completed: Number(item.completed),
        cancelled: Number(item.cancelled),
        completionRate: item.total > 0 ? 
          ((Number(item.completed) / Number(item.total)) * 100).toFixed(2) : '0.00'
      })) : [],
      timeSlotStats: Array.isArray(timeSlotStats) ? timeSlotStats.map((item: any) => ({
        timeSlot: item.timeSlot,
        count: Number(item.count)
      })) : [],
      weekdayStats: Array.isArray(weekdayStats) ? weekdayStats.map((item: any) => ({
        weekday: item.weekday,
        count: Number(item.count)
      })) : []
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('獲取預約統計數據失敗:', error)
    return NextResponse.json({ error: '獲取預約統計數據失敗' }, { status: 500 })
  }
}