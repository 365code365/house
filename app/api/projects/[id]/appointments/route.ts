import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - 獲取項目的預約數據
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const date = searchParams.get('date')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    
    // 驗證項目是否存在
    const projectExists = await executeQuery(
      'SELECT id FROM project WHERE id = ?',
      [projectId]
    )
    
    if (!Array.isArray(projectExists) || projectExists.length === 0) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 構建查詢條件
    let whereClause = 'WHERE project_id = ?'
    const queryParams: any[] = [projectId]
    
    if (status) {
      whereClause += ' AND status = ?'
      queryParams.push(status)
    }
    
    if (search) {
      whereClause += ' AND (customer_name LIKE ? OR phone LIKE ? OR remark LIKE ?)'
      const searchPattern = `%${search}%`
      queryParams.push(searchPattern, searchPattern, searchPattern)
    }
    
    if (date) {
      whereClause += ' AND DATE(start_time) = ?'
      queryParams.push(date)
    }
    
    // 獲取總數
    const countQuery = `
      SELECT COUNT(*) as total
      FROM customer_appointment 
      ${whereClause}
    `
    
    const countResult = await executeQuery(countQuery, queryParams) as any[]
    const total = countResult[0]?.total || 0
    
    // 計算分頁
    const offset = (page - 1) * pageSize
    const totalPages = Math.ceil(total / pageSize)
    
    const query = `
      SELECT 
        id,
        project_id,
        customer_name,
        phone as customer_phone,
        start_time,
        end_time,
        status,
        sales_id,
        remark,
        created_at,
        updated_at
      FROM customer_appointment 
      ${whereClause}
      ORDER BY start_time DESC
      LIMIT ? OFFSET ?
    `
    
    const appointments = await executeQuery(query, [...queryParams, pageSize, offset])
    
    return NextResponse.json({
      data: appointments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('獲取預約數據失敗:', error)
    return NextResponse.json({ error: '獲取預約數據失敗' }, { status: 500 })
  }
}

// POST - 創建新的預約
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    const body = await request.json()
    
    // 處理字段映射
    const {
      customer_name,
      customer_phone,
      customer_email,
      date,
      time,
      end_date,
      end_time: end_time_input,
      purpose,
      sales_person,
      notes,
      // 兼容舊格式
      phone,
      start_time,
      end_time,
      sales_id,
      remark
    } = body

    // 字段映射和处理
    const mappedPhone = customer_phone || phone
    // 映射 sales_person 到 sales_id
    let mappedSalesId = 'SP001'; // 默认使用第一个销售人员
    if (sales_person) {
      // 检查 sales_person 是否存在于 sales_personnel 表中
      const salesPersonExists = await executeQuery(
        'SELECT employee_no FROM sales_personnel WHERE employee_no = ?',
        [sales_person]
      ) as any[];
      
      if (salesPersonExists.length > 0) {
        mappedSalesId = sales_person;
      }
    }
    const mappedRemark = purpose || notes || remark
    
    // 處理時間字段
    let mappedStartTime = start_time
    let mappedEndTime = end_time
    
    if (date && time) {
      // 組合開始日期和時間
      mappedStartTime = `${date} ${time}:00`
      
      // 處理結束時間
      if (end_date && end_time_input) {
        // 如果提供了結束日期和時間，使用用戶提供的值
        mappedEndTime = `${end_date} ${end_time_input}:00`
      } else {
        // 默認預約時長1小時
        const startDate = new Date(mappedStartTime)
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 加1小時
        // 確保時間格式正確，不使用ISO格式
        const year = endDate.getFullYear()
        const month = String(endDate.getMonth() + 1).padStart(2, '0')
        const day = String(endDate.getDate()).padStart(2, '0')
        const hours = String(endDate.getHours()).padStart(2, '0')
        const minutes = String(endDate.getMinutes()).padStart(2, '0')
        const seconds = String(endDate.getSeconds()).padStart(2, '0')
        mappedEndTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }
    }

    // 驗證必填字段
    if (!customer_name || !mappedPhone || !mappedStartTime || !mappedEndTime) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
    // 驗證項目是否存在
    const projectExists = await executeQuery(
      'SELECT id FROM project WHERE id = ?',
      [projectId]
    )
    
    if (!Array.isArray(projectExists) || projectExists.length === 0) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 檢查同一時間是否已有預約
    const conflictingAppointment = await executeQuery(
      'SELECT id FROM customer_appointment WHERE project_id = ? AND start_time < ? AND end_time > ? AND status != "已取消"',
      [projectId, mappedEndTime, mappedStartTime]
    )
    
    if (Array.isArray(conflictingAppointment) && conflictingAppointment.length > 0) {
      return NextResponse.json({ error: '該時間段已有預約' }, { status: 400 })
    }
    
    // 調試：打印sales_id值
    console.log('準備插入的sales_id:', mappedSalesId, '類型:', typeof mappedSalesId);
    
    // 使用Prisma Client創建預約記錄
    const result = await prisma.customerAppointment.create({
      data: {
        projectId: parseInt(projectId),
        customerName: customer_name,
        phone: mappedPhone,
        startTime: new Date(mappedStartTime),
        endTime: new Date(mappedEndTime),
        salesId: mappedSalesId,
        remark: mappedRemark || null,
        status: 'PENDING' // 使用枚举值
      }
    })
    
    if (result && result.id) {
      // Prisma Client已經返回完整的記錄
      return NextResponse.json(result, { status: 201 })
    }
    
    return NextResponse.json({ error: '創建預約失敗' }, { status: 500 })
  } catch (error) {
    console.error('創建預約失敗:', error)
    return NextResponse.json({ error: '創建預約失敗' }, { status: 500 })
  }
}