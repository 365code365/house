import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

// PUT - 更新預約
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; appointmentId: string } }
) {
  try {
    const { id: projectId, appointmentId } = params
    const body = await request.json()
    
    // 检查是否只是状态更新
    if (body.status && Object.keys(body).length === 1) {
      // 仅更新状态
      await executeQuery(
        'UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ? AND project_id = ?',
        [body.status, appointmentId, projectId]
      )
      return NextResponse.json({ message: '預約狀態更新成功' })
    }
    
    const {
      customer_name,
      customer_phone,
      customer_email,
      date,
      time,
      purpose,
      sales_person,
      notes,
      status
    } = body
    
    // 檢查預約是否存在且屬於該項目
    const existingAppointment = await executeQuery(
      'SELECT id FROM appointments WHERE id = ? AND project_id = ?',
      [appointmentId, projectId]
    )
    
    if (!Array.isArray(existingAppointment) || existingAppointment.length === 0) {
      return NextResponse.json({ error: '預約不存在' }, { status: 404 })
    }
    
    // 驗證日期和時間格式
    if (!date || !time) {
      return NextResponse.json({ error: '日期和時間不能為空' }, { status: 400 })
    }
    
    // 檢查時間衝突（排除當前預約）
    const conflictingAppointment = await executeQuery(
      'SELECT id FROM appointments WHERE project_id = ? AND appointment_date = ? AND appointment_time = ? AND id != ? AND status != "cancelled"',
      [projectId, date, time, appointmentId]
    )
    
    if (Array.isArray(conflictingAppointment) && conflictingAppointment.length > 0) {
      return NextResponse.json({ error: '該時間段已有預約' }, { status: 400 })
    }
    
    // 更新預約
    await executeQuery(
      `UPDATE appointments SET 
        customer_name = ?,
        customer_phone = ?,
        customer_email = ?,
        appointment_date = ?,
        appointment_time = ?,
        sales_person = ?,
        status = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ? AND project_id = ?`,
      [
        customer_name,
        customer_phone,
        customer_email || null,
        date,
        time,
        sales_person || null,
        status || 'scheduled',
        notes || null,
        appointmentId,
        projectId
      ]
    )
    
    return NextResponse.json({ message: '預約更新成功' })
  } catch (error) {
    console.error('更新預約失敗:', error)
    return NextResponse.json({ error: '更新預約失敗' }, { status: 500 })
  }
}

// DELETE - 刪除預約
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; appointmentId: string } }
) {
  try {
    const { id: projectId, appointmentId } = params
    
    // 檢查預約是否存在且屬於該項目
    const existingAppointment = await executeQuery(
      'SELECT id FROM appointments WHERE id = ? AND project_id = ?',
      [appointmentId, projectId]
    )

    if (!Array.isArray(existingAppointment) || existingAppointment.length === 0) {
      return NextResponse.json({ error: '預約不存在' }, { status: 404 })
    }

    // 刪除預約記錄
    await executeQuery(
      'DELETE FROM appointments WHERE id = ? AND project_id = ?',
      [appointmentId, projectId]
    )
    
    return NextResponse.json({ message: '預約已刪除' })
  } catch (error) {
    console.error('刪除預約失敗:', error)
    return NextResponse.json({ error: '刪除預約失敗' }, { status: 500 })
  }
}

// GET - 獲取單個預約詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; appointmentId: string } }
) {
  try {
    const { id: projectId, appointmentId } = params
    
    const appointment = await executeQuery(
      `SELECT 
        id,
        customer_name,
        customer_phone as phone,
        customer_email as email,
        appointment_date,
        appointment_time,
        sales_person,
        status,
        notes,
        created_at,
        updated_at
      FROM appointments 
      WHERE id = ? AND project_id = ?`,
      [appointmentId, projectId]
    )
    
    if (!Array.isArray(appointment) || appointment.length === 0) {
      return NextResponse.json({ error: '預約不存在' }, { status: 404 })
    }
    
    return NextResponse.json(appointment[0])
  } catch (error) {
    console.error('獲取預約詳情失敗:', error)
    return NextResponse.json({ error: '獲取預約詳情失敗' }, { status: 500 })
  }
}