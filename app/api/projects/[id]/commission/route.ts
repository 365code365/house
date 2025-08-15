import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withErrorHandler, createSuccessResponse, createValidationError, createNotFoundError } from '@/lib/error-handler'
import { createProtectedApiHandler } from '@/lib/auth-utils'

// GET - 獲取項目的佣金數據
export const GET = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      throw createNotFoundError('項目不存在')
    }
    
    // 構建查詢條件
    const whereConditions: any = {
      projectId: projectId
    }
    
    if (status) {
      whereConditions.commissionStatus = status
    }
    
    if (search) {
      whereConditions.OR = [
        { building: { contains: search } },
        { unit: { contains: search } },
        { salesPersonnel: { contains: search } }
      ]
    }
    
    if (startDate && endDate) {
      whereConditions.salesDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    // 獲取總數
    const total = await prisma.commissionList.count({
      where: whereConditions
    })
    
    // 計算分頁
    const offset = (page - 1) * pageSize
    const totalPages = Math.ceil(total / pageSize)
    
    const commissions = await prisma.commissionList.findMany({
      where: whereConditions,
      orderBy: {
        salesDate: 'desc'
      },
      skip: offset,
      take: pageSize
    })
    
    return createSuccessResponse(commissions, {
      page,
      limit: pageSize,
      total,
      totalPages
    })
}, ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCE'])

// POST - 創建新的佣金記錄
export const POST = createProtectedApiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = parseInt(params.id)
    const body = await request.json()
    const {
      building,
      unit,
      area,
      floor,
      salesId,
      salesDate,
      totalPrice,
      totalCommissionRate,
      totalCommission,
      status,
      houseNo
    } = body
    
    // 驗證必填字段
    if (!building || !unit || !salesId || floor === undefined) {
      throw createValidationError('缺少必填字段：樓棟、單元、銷售人員、樓層為必填項')
    }
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      throw createNotFoundError('項目不存在')
    }
    
    // 創建佣金記錄
    const newRecord = await prisma.commissionList.create({
      data: {
        projectId,
        building,
        unit,
        area: area ? parseFloat(area) : undefined,
        floor: parseInt(floor),
        salesId,
        salesDate: salesDate ? new Date(salesDate) : undefined,
        totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
        totalCommissionRate: totalCommissionRate ? parseFloat(totalCommissionRate) : 0,
        totalCommission: totalCommission ? parseFloat(totalCommission) : 0,
        status: status || 'SOLD',
        houseNo: houseNo || undefined
      }
    })
    
    return createSuccessResponse(newRecord, undefined, 201)
}, ['SUPER_ADMIN', 'ADMIN', 'FINANCE'])