import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ParkingSpace } from '@/lib/db'
import { withErrorHandler, createSuccessResponse, createValidationError, createNotFoundError } from '@/lib/error-handler'

// GET - 獲取項目的停車位數據
export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: parseInt(projectId) }
    })
    
    if (!projectExists) {
      throw createNotFoundError('項目不存在')
    }
    
    // 構建查詢條件
    const whereConditions: any = {
      projectId: parseInt(projectId)
    }
    
    if (type) {
      whereConditions.type = type
    }
    
    if (status) {
      whereConditions.salesStatus = status
    }
    
    if (search) {
      whereConditions.OR = [
        { parkingNo: { contains: search } },
        { location: { contains: search } },
        { buyer: { contains: search } }
      ]
    }
    
    // 獲取總數
    const total = await prisma.parkingSpace.count({
      where: whereConditions
    })
    
    // 計算分頁
    const offset = (page - 1) * pageSize
    const totalPages = Math.ceil(total / pageSize)
    
    const parkingSpaces = await prisma.parkingSpace.findMany({
      where: whereConditions,
      orderBy: {
        parkingNo: 'asc'
      },
      skip: offset,
      take: pageSize
    })
    
    // 轉換為前端期望的格式
    const formattedSpaces = parkingSpaces.map(space => ({
      id: space.id,
      projectId: space.projectId,
      spaceNumber: space.parkingNo,
      type: space.type,
      location: space.location,
      price: space.price,
      status: space.salesStatus,
      customerName: space.buyer,
      salesPerson: space.salesId,
      contractDate: space.salesDate,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt
    }))
    
    return createSuccessResponse(parkingSpaces, {
      page,
      limit: pageSize,
      total,
      totalPages
    })
})

// POST - 創建新的停車位
export const POST = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id
    const body = await request.json()
    const {
      spaceNumber,
      type,
      location,
      price,
      status = 'available',
      customerName,
      salesPerson,
      contractDate
    } = body
    
    // 驗證必填字段
    if (!spaceNumber || !type || !location || price === undefined) {
      throw createValidationError('缺少必填字段：車位編號、類型、位置、價格為必填項')
    }
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: parseInt(projectId) }
    })
    
    if (!projectExists) {
      throw createNotFoundError('項目不存在')
    }
    
    // 檢查車位編號是否已存在
    const existingSpace = await prisma.parkingSpace.findFirst({
      where: {
        projectId: parseInt(projectId),
        parkingNo: spaceNumber
      }
    })
    
    if (existingSpace) {
      throw createValidationError('該車位編號已存在')
    }
    
    // 創建停車位記錄
    const newRecord = await prisma.parkingSpace.create({
      data: {
        projectId: parseInt(projectId),
        parkingNo: spaceNumber,
        type: type as any,
        location: location,
        price: parseFloat(price),
        salesStatus: status as any || 'AVAILABLE',
        buyer: customerName || null,
        salesId: salesPerson || null,
        salesDate: contractDate ? new Date(contractDate) : null
      }
    })
    
    // 返回創建的記錄，轉換為前端期望的格式
    const formattedRecord = {
      id: newRecord.id,
      projectId: newRecord.projectId,
      spaceNumber: newRecord.parkingNo,
      type: newRecord.type,
      location: newRecord.location,
      price: newRecord.price,
      status: newRecord.salesStatus,
      customerName: newRecord.buyer,
      salesPerson: newRecord.salesId,
      contractDate: newRecord.salesDate,
      createdAt: newRecord.createdAt,
      updatedAt: newRecord.updatedAt
    }
    
    return createSuccessResponse(formattedRecord, undefined, 201)
})