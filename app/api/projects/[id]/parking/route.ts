import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ParkingSpace } from '@/lib/db'
import { withErrorHandler, createSuccessResponse, createValidationError, createNotFoundError } from '@/lib/error-handler'

// 停車位類型映射：中文 -> 枚舉值
const PARKING_TYPE_MAPPING: Record<string, string> = {
  '平面': 'FLAT',
  '機械上層': 'MECHANICAL_TOP',
  '機械中層': 'MECHANICAL_MID',
  '機械下層': 'MECHANICAL_BOT',
  '機械平移': 'MECHANICAL_MOVE',
  '機車位': 'MOTORCYCLE',
  '腳踏車位': 'BICYCLE',
  '自設': 'SELF_BUILT',
  '法定': 'LEGAL'
}

// 將中文類型值轉換為枚舉值
function mapParkingType(typeValue: string): string {
  // 如果已經是英文枚舉值，直接返回
  const validEnumValues = ['FLAT', 'MECHANICAL_TOP', 'MECHANICAL_MID', 'MECHANICAL_BOT', 'MECHANICAL_MOVE', 'MOTORCYCLE', 'BICYCLE', 'SELF_BUILT', 'LEGAL']
  if (validEnumValues.includes(typeValue)) {
    return typeValue
  }
  
  // 否則從中文映射
  const enumValue = PARKING_TYPE_MAPPING[typeValue]
  if (!enumValue) {
    throw createValidationError(`無效的停車位類型：${typeValue}`)
  }
  return enumValue
}

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
      parkingNo: space.parkingNo,
      type: space.type,
      location: space.location,
      price: space.price,
      status: space.salesStatus,
      buyer: space.buyer,
      salesId: space.salesId,
      contractDate: space.salesDate,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt
    }))
    
    return createSuccessResponse(formattedSpaces, {
      page,
      limit: pageSize,
      total,
      totalPages
    })
})

// 狀態值映射：前端到後端
function mapParkingStatus(frontendStatus: string): string {
  const statusMapping: Record<string, string> = {
    'available': 'AVAILABLE',
    'reserved': 'DEPOSIT', 
    'sold': 'SOLD',
    'unavailable': 'UNAVAILABLE'
  }
  
  // 如果已經是大寫格式，直接返回
  if (['AVAILABLE', 'DEPOSIT', 'SOLD', 'UNAVAILABLE'].includes(frontendStatus)) {
    return frontendStatus
  }
  
  return statusMapping[frontendStatus] || 'AVAILABLE'
}

// POST - 創建新的停車位
export const POST = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id
    const body = await request.json()
    const {
      parkingNo,
      type,
      location,
      price,
      status = 'available',
      buyer,
      salesId,
      contractDate
    } = body
    
    // 驗證必填字段
    if (!parkingNo || !type || !location || price === undefined) {
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
        parkingNo: parkingNo
      }
    })
    
    if (existingSpace) {
      throw createValidationError('該車位編號已存在')
    }
    
    // 轉換類型值和狀態值
    const mappedType = mapParkingType(type)
    const mappedStatus = mapParkingStatus(status)
    
    // 創建停車位記錄
    const newRecord = await prisma.parkingSpace.create({
      data: {
        projectId: parseInt(projectId),
        parkingNo: parkingNo,
        type: mappedType as any,
        location: location,
        price: parseFloat(price),
        salesStatus: mappedStatus as any,
        buyer: buyer || null,
        salesId: salesId || null,
        salesDate: contractDate ? new Date(contractDate) : null
      }
    })
    
    // 返回創建的記錄，轉換為前端期望的格式
    const formattedRecord = {
      id: newRecord.id,
      projectId: newRecord.projectId,
      parkingNo: newRecord.parkingNo,
      type: newRecord.type,
      location: newRecord.location,
      price: newRecord.price,
      status: newRecord.salesStatus,
      buyer: newRecord.buyer,
      salesId: newRecord.salesId,
      contractDate: newRecord.salesDate,
      createdAt: newRecord.createdAt,
      updatedAt: newRecord.updatedAt
    }
    
    return createSuccessResponse(formattedRecord, undefined, 201)
})