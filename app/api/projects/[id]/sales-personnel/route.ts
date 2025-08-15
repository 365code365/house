import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createProtectedApiHandler } from '@/lib/auth-utils'

// GET - 獲取項目的銷售人員數據
export const GET = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const projectId = parseInt(params.id)
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 獲取銷售人員基本信息
    const salesPersonnel = await prisma.salesPersonnel.findMany({
      where: {
        projectIds: {
          contains: projectId.toString()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // 為每個銷售人員獲取統計信息
    const salesPersonnelWithStats = await Promise.all(
      salesPersonnel.map(async (person) => {
        // 獲取總銷售額和銷售套數
        const salesStats = await prisma.salesControl.aggregate({
          where: {
            salesId: person.employeeNo,
            projectId: projectId,
            salesStatus: {
              in: ['SOLD', 'DEPOSIT']
            }
          },
          _count: {
            id: true
          },
          _sum: {
            totalWithParking: true
          }
        })
        
        // 獲取本月銷售數據
        const currentDate = new Date()
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        
        const currentMonthStats = await prisma.salesControl.count({
          where: {
            salesId: person.employeeNo,
            projectId: projectId,
            salesStatus: {
              in: ['SOLD', 'DEPOSIT']
            },
            salesDate: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth
            }
          }
        })
        
        return {
          id: person.id,
          employee_no: person.employeeNo,
          name: person.name,
          email: person.email,
          phone: person.phone,
          project_ids: person.projectIds,
          remark: person.remark,
          created_at: person.createdAt,
          updated_at: person.updatedAt,
          total_sales: salesStats._count?.id || 0,
          total_amount: parseFloat(salesStats._sum?.totalWithParking?.toString() || '0'),
          current_month_sales: currentMonthStats || 0
        }
      })
    )
    
    return NextResponse.json(salesPersonnelWithStats)
  } catch (error) {
    console.error('獲取銷售人員數據失敗:', error)
    return NextResponse.json({ error: '獲取銷售人員數據失敗' }, { status: 500 })
  }
});

// POST - 創建新的銷售人員
export const POST = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const projectId = parseInt(params.id)
    const body = await request.json()
    
    const {
      employee_no,
      name,
      email,
      phone,
      remark
    } = body
    
    // 驗證必填字段
    if (!employee_no || !name || !email) {
      return NextResponse.json({ error: '員工編號、姓名和郵箱為必填項' }, { status: 400 })
    }
    
    // 檢查員工編號是否已存在
    const existingEmployee = await prisma.salesPersonnel.findUnique({
      where: { employeeNo: employee_no }
    })
    
    if (existingEmployee) {
      return NextResponse.json({ error: '員工編號已存在' }, { status: 400 })
    }
    
    // 檢查郵箱是否已存在
    const existingEmail = await prisma.salesPersonnel.findUnique({
      where: { email: email }
    })
    
    if (existingEmail) {
      return NextResponse.json({ error: '郵箱已存在' }, { status: 400 })
    }
    
    // 生成默認密碼（員工編號）
    const defaultPassword = await bcrypt.hash(employee_no, 10)
    
    // 創建新的銷售人員
    const newSalesPersonnel = await prisma.salesPersonnel.create({
      data: {
        employeeNo: employee_no,
        name,
        email,
        password: defaultPassword,
        phone: phone || null,
        projectIds: projectId.toString(),
        remark: remark || null
      }
    })
    
    // 返回創建的記錄
    return NextResponse.json({
      id: newSalesPersonnel.id,
      employee_no: newSalesPersonnel.employeeNo,
      name: newSalesPersonnel.name,
      email: newSalesPersonnel.email,
      phone: newSalesPersonnel.phone,
      project_ids: newSalesPersonnel.projectIds,
      remark: newSalesPersonnel.remark,
      created_at: newSalesPersonnel.createdAt,
      updated_at: newSalesPersonnel.updatedAt
    }, { status: 201 })
  } catch (error) {
    console.error('創建銷售人員失敗:', error)
    return NextResponse.json({ error: '創建銷售人員失敗' }, { status: 500 })
  }
});