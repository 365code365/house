import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

// 獲取建案統計數據
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { message: '無效的建案ID' },
        { status: 400 }
      )
    }

    // 檢查建案是否存在
    const project = await executeQuery(
      'SELECT id FROM project WHERE id = ?',
      [projectId]
    ) as any[]

    if (project.length === 0) {
      return NextResponse.json(
        { message: '建案不存在' },
        { status: 404 }
      )
    }

    // 獲取銷控統計
    const salesStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_units,
        SUM(CASE WHEN sales_status = '售出' THEN 1 ELSE 0 END) as sold_units,
        SUM(CASE WHEN sales_status = '訂金' THEN 1 ELSE 0 END) as reserved_units,
        SUM(CASE WHEN sales_status = '未售出' THEN 1 ELSE 0 END) as available_units
      FROM sales_control 
      WHERE project_id = ?
    `, [projectId]) as any[]

    // 獲取停車位統計
    const parkingStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_parking_spaces,
        SUM(CASE WHEN sales_status = '售出' THEN 1 ELSE 0 END) as sold_parking_spaces
      FROM parking_space 
      WHERE project_id = ?
    `, [projectId]) as any[]

    // 獲取客戶統計
    const customerStats = await executeQuery(`
      SELECT COUNT(DISTINCT id) as total_customers
      FROM purchased_customer 
      WHERE project_id = ?
    `, [projectId]) as any[]

    // 獲取預約統計
    const appointmentStats = await executeQuery(`
      SELECT COUNT(*) as total_appointments
      FROM customer_appointment 
      WHERE project_id = ? AND status != '已取消'
    `, [projectId]) as any[]

    const stats = {
      totalUnits: salesStats[0]?.total_units || 0,
      soldUnits: salesStats[0]?.sold_units || 0,
      reservedUnits: salesStats[0]?.reserved_units || 0,
      availableUnits: salesStats[0]?.available_units || 0,
      totalParkingSpaces: parkingStats[0]?.total_parking_spaces || 0,
      soldParkingSpaces: parkingStats[0]?.sold_parking_spaces || 0,
      totalCustomers: customerStats[0]?.total_customers || 0,
      totalAppointments: appointmentStats[0]?.total_appointments || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('獲取建案統計失敗:', error)
    return NextResponse.json(
      { message: '獲取建案統計失敗' },
      { status: 500 }
    )
  }
}