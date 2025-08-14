import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT - 更新预约
export async function PUT(request: NextRequest, { params }: { params: { id: string, appointmentId: string } }) {
  try {
    const projectId = params.id
    const appointmentId = params.appointmentId
    const body = await request.json()
    
    // 处理字段映射
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
      status,
      // 兼容旧格式
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
    
    // 处理时间字段
    let mappedStartTime = start_time
    let mappedEndTime = end_time
    
    if (date && time) {
      // 组合开始日期和时间
      mappedStartTime = `${date} ${time}:00`
      
      // 处理结束时间
      if (end_date && end_time_input) {
        // 如果提供了结束日期和时间，使用用户提供的值
        mappedEndTime = `${end_date} ${end_time_input}:00`
      } else {
        // 默认预约时长1小时
        const startDate = new Date(mappedStartTime)
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 加1小时
        // 确保时间格式正确，不使用ISO格式
        const year = endDate.getFullYear()
        const month = String(endDate.getMonth() + 1).padStart(2, '0')
        const day = String(endDate.getDate()).padStart(2, '0')
        const hours = String(endDate.getHours()).padStart(2, '0')
        const minutes = String(endDate.getMinutes()).padStart(2, '0')
        const seconds = String(endDate.getSeconds()).padStart(2, '0')
        mappedEndTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }
    }

    // 验证必填字段 - 只在创建新预约或更新所有字段时验证
    // 如果只是更新状态，不需要验证其他字段
    const isStatusOnlyUpdate = Object.keys(body).length === 1 && body.hasOwnProperty('status')
    
    if (!isStatusOnlyUpdate && (!customer_name || !mappedPhone || !mappedStartTime || !mappedEndTime)) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
    // 验证预约是否存在
    const appointmentExists = await executeQuery(
      'SELECT id FROM customer_appointment WHERE id = ? AND project_id = ?',
      [appointmentId, projectId]
    )
    
    if (!Array.isArray(appointmentExists) || appointmentExists.length === 0) {
      return NextResponse.json({ error: '预约不存在' }, { status: 404 })
    }
    
    // 检查同一时间是否已有其他预约（排除当前预约）
    const conflictingAppointment = await executeQuery(
      'SELECT id FROM customer_appointment WHERE project_id = ? AND id != ? AND start_time < ? AND end_time > ? AND status != "已取消"',
      [projectId, appointmentId, mappedEndTime, mappedStartTime]
    )
    
    if (Array.isArray(conflictingAppointment) && conflictingAppointment.length > 0) {
      return NextResponse.json({ error: '该时间段已有其他预约' }, { status: 400 })
    }
    
    // 准备更新数据
    let updateData: any = {}
    
    if (isStatusOnlyUpdate) {
      // 如果只是更新状态，只更新状态字段
      // 映射状态值到Prisma枚举
      let mappedStatus = status
      if (status === 'completed') {
        mappedStatus = 'COMPLETED'
      } else if (status === 'confirmed') {
        mappedStatus = 'CONFIRMED'
      } else if (status === 'cancelled') {
        mappedStatus = 'CANCELLED'
      } else if (status === 'pending') {
        mappedStatus = 'PENDING'
      }
      
      updateData.status = mappedStatus
    } else {
      // 如果是完整更新，更新所有字段
      updateData = {
        customerName: customer_name,
        phone: mappedPhone,
        startTime: new Date(mappedStartTime),
        endTime: new Date(mappedEndTime),
        salesId: mappedSalesId,
        remark: mappedRemark || null
      }
      
      // 如果提供了状态，也更新状态
      if (status) {
        let mappedStatus = status
        if (status === 'completed') {
          mappedStatus = 'COMPLETED'
        } else if (status === 'confirmed') {
          mappedStatus = 'CONFIRMED'
        } else if (status === 'cancelled') {
          mappedStatus = 'CANCELLED'
        } else if (status === 'pending') {
          mappedStatus = 'PENDING'
        }
        
        updateData.status = mappedStatus
      }
    }
    
    // 使用Prisma Client更新预约记录
    try {
      const result = await prisma.customerAppointment.update({
        where: {
          id: parseInt(appointmentId)
        },
        data: updateData
      })
      
      if (result && result.id) {
        return NextResponse.json(result)
      }
      
      return NextResponse.json({ error: '更新预约失败' }, { status: 500 })
    } catch (prismaError) {
      console.error('Prisma更新失败:', prismaError)
      return NextResponse.json({ 
        error: '更新预约失败', 
        details: prismaError instanceof Error ? prismaError.message : '未知错误'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('更新预约失败:', error)
    return NextResponse.json({ error: '更新预约失败' }, { status: 500 })
  }
}

// DELETE - 删除预约
export async function DELETE(request: NextRequest, { params }: { params: { id: string, appointmentId: string } }) {
  try {
    const projectId = params.id
    const appointmentId = params.appointmentId
    
    // 验证预约是否存在
    const appointmentExists = await executeQuery(
      'SELECT id FROM customer_appointment WHERE id = ? AND project_id = ?',
      [appointmentId, projectId]
    )
    
    if (!Array.isArray(appointmentExists) || appointmentExists.length === 0) {
      return NextResponse.json({ error: '预约不存在' }, { status: 404 })
    }
    
    // 使用Prisma Client删除预约记录
    await prisma.customerAppointment.delete({
      where: {
        id: parseInt(appointmentId)
      }
    })
    
    return NextResponse.json({ message: '预约删除成功' })
  } catch (error) {
    console.error('删除预约失败:', error)
    return NextResponse.json({ error: '删除预约失败' }, { status: 500 })
  }
}