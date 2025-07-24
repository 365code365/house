import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// PUT - 更新销售人员信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; personnelId: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const personnelId = parseInt(params.personnelId)
    const body = await request.json()
    
    const {
      employee_no,
      name,
      email,
      password,
      phone,
      project_ids,
      remark
    } = body
    
    // 验证必填字段
    if (!employee_no || !name || !email) {
      return NextResponse.json({ error: '员工编号、姓名和邮箱为必填项' }, { status: 400 })
    }
    
    // 检查销售人员是否存在
    const existingPersonnel = await prisma.salesPersonnel.findUnique({
      where: { id: personnelId }
    })
    
    if (!existingPersonnel) {
      return NextResponse.json({ error: '销售人员不存在' }, { status: 404 })
    }
    
    // 检查员工编号是否被其他人使用
    const duplicateEmployee = await prisma.salesPersonnel.findFirst({
      where: {
        employeeNo: employee_no,
        id: { not: personnelId }
      }
    })
    
    if (duplicateEmployee) {
      return NextResponse.json({ error: '员工编号已被其他人使用' }, { status: 400 })
    }
    
    // 检查邮箱是否被其他人使用
    const duplicateEmail = await prisma.salesPersonnel.findFirst({
      where: {
        email: email,
        id: { not: personnelId }
      }
    })
    
    if (duplicateEmail) {
      return NextResponse.json({ error: '邮箱已被其他人使用' }, { status: 400 })
    }
    
    // 构建更新数据
    const updateData: any = {
      employeeNo: employee_no,
      name: name,
      email: email,
      phone: phone || null,
      projectIds: projectId.toString(),
      remark: remark || null
    }
    
    // 如果提供了新密码，则更新密码
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password = hashedPassword
    }
    
    // 更新销售人员
    const updatedRecord = await prisma.salesPersonnel.update({
      where: { id: personnelId },
      data: updateData,
      select: {
         id: true,
         employeeNo: true,
         name: true,
         email: true,
         phone: true,
         projectIds: true,
         remark: true,
         createdAt: true,
         updatedAt: true
       }
    })
    
    return NextResponse.json({
       id: updatedRecord.id,
       employee_no: updatedRecord.employeeNo,
       name: updatedRecord.name,
       email: updatedRecord.email,
       phone: updatedRecord.phone,
       project_ids: updatedRecord.projectIds,
       remark: updatedRecord.remark,
       created_at: updatedRecord.createdAt,
       updated_at: updatedRecord.updatedAt
     })
  } catch (error) {
    console.error('更新销售人员失败:', error)
    return NextResponse.json({ error: '更新销售人员失败' }, { status: 500 })
  }
}

// DELETE - 删除销售人员
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; personnelId: string } }
) {
  try {
    const personnelId = parseInt(params.personnelId)
    
    // 检查销售人员是否存在
    const existingPersonnel = await prisma.salesPersonnel.findUnique({
      where: { id: personnelId }
    })
    
    if (!existingPersonnel) {
      return NextResponse.json({ error: '销售人员不存在' }, { status: 404 })
    }
    
    // 检查是否有关联的销售记录
    const salesRecordsCount = await prisma.salesControl.count({
      where: {
        salesId: existingPersonnel.employeeNo
      }
    })
    
    if (salesRecordsCount > 0) {
      return NextResponse.json({ 
        error: `无法删除该销售人员，因为存在 ${salesRecordsCount} 条关联的销售记录` 
      }, { status: 400 })
    }
    
    // 删除销售人员
    await prisma.salesPersonnel.delete({
      where: { id: personnelId }
    })
    
    return NextResponse.json({ message: '销售人员删除成功' })
  } catch (error) {
    console.error('删除销售人员失败:', error)
    return NextResponse.json({ error: '删除销售人员失败' }, { status: 500 })
  }
}