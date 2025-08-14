import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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

// 狀態值映射：前端到後端
function mapParkingStatus(frontendStatus: string): string {
  const statusMapping: Record<string, string> = {
    'available': 'AVAILABLE',
    'reserved': 'DEPOSIT', 
    'sold': 'SOLD',
    'not_sale': 'NOT_SALE'
  }
  
  // 如果已經是大寫格式，直接返回
  if (['AVAILABLE', 'DEPOSIT', 'SOLD', 'NOT_SALE'].includes(frontendStatus)) {
    return frontendStatus
  }
  
  return statusMapping[frontendStatus] || 'AVAILABLE'
}

// PUT - 更新停車位
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; spaceId: string } }
) => {
  const { id: projectId, spaceId } = params
  const body = await request.json()
  
  console.log('PUT /parking/[spaceId] - Request body:', body)
  console.log('PUT /parking/[spaceId] - Params:', { projectId, spaceId })
  
  const {
    parkingNo,
    type,
    location,
    price,
    salesStatus,
    buyer,
    salesId,
    contractDate
  } = body
  
  // 檢查停車位是否存在且屬於該項目
  const existingSpace = await prisma.parkingSpace.findFirst({
    where: {
      id: parseInt(spaceId),
      projectId: parseInt(projectId)
    }
  })
  
  if (!existingSpace) {
    throw createNotFoundError('停車位不存在')
  }
  
  // 檢查車位編號是否重複（排除當前記錄）
  const duplicateSpace = await prisma.parkingSpace.findFirst({
    where: {
      projectId: parseInt(projectId),
      parkingNo: parkingNo,
      id: { not: parseInt(spaceId) }
    }
  })
    
  if (duplicateSpace) {
    throw createValidationError('該車位編號已存在')
  }
  
  // 映射停車位類型和狀態值
  const mappedType = mapParkingType(type)
  const mappedStatus = mapParkingStatus(salesStatus)
  
  console.log('PUT /parking/[spaceId] - Mapped values:', { 
    originalType: type, 
    mappedType, 
    originalStatus: salesStatus, 
    mappedStatus 
  })
  
  const updateData = {
    parkingNo: parkingNo,
    type: mappedType as any,
    location: location,
    price: parseFloat(price),
    salesStatus: mappedStatus as any,
    buyer: buyer || null,
    salesId: salesId || null,
    salesDate: contractDate ? new Date(contractDate) : null
  }
  
  console.log('PUT /parking/[spaceId] - Update data:', updateData)
  
  await prisma.parkingSpace.update({
    where: { id: parseInt(spaceId) },
    data: updateData
  })
  
  return createSuccessResponse({ message: '停車位已更新' })
})

// DELETE - 刪除停車位
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; spaceId: string } }
) {
  try {
    const { id: projectId, spaceId } = params
    
    // 檢查停車位是否存在且屬於該項目
    const existingSpace = await prisma.parkingSpace.findFirst({
      where: {
        id: parseInt(spaceId),
        projectId: parseInt(projectId)
      }
    })
    
    if (!existingSpace) {
      return NextResponse.json({ error: '停車位不存在' }, { status: 404 })
    }
    
    // 檢查是否可以刪除（已售出的停車位可能需要特殊處理）
    if (existingSpace.salesStatus === 'SOLD') {
      return NextResponse.json({ 
        error: '已售出的停車位不能直接刪除，請先處理相關合約' 
      }, { status: 400 })
    }
    
    await prisma.parkingSpace.delete({
      where: { id: parseInt(spaceId) }
    })
    
    return NextResponse.json({ message: '停車位已刪除' })
  } catch (error) {
    console.error('刪除停車位失敗:', error)
    return NextResponse.json({ error: '刪除停車位失敗' }, { status: 500 })
  }
}

// GET - 獲取單個停車位詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; spaceId: string } }
) {
  try {
    const { id: projectId, spaceId } = params
    
    const parkingSpace = await prisma.parkingSpace.findFirst({
      where: {
        id: parseInt(spaceId),
        projectId: parseInt(projectId)
      }
    })
    
    if (!parkingSpace) {
      return NextResponse.json({ error: '停車位不存在' }, { status: 404 })
    }
    
    // 轉換為前端期望的格式 - 保持與Prisma模型一致的字段名
    return NextResponse.json({
      id: parkingSpace.id,
      projectId: parkingSpace.projectId,
      parkingNo: parkingSpace.parkingNo,
      type: parkingSpace.type,
      location: parkingSpace.location,
      price: parkingSpace.price,
      salesStatus: parkingSpace.salesStatus,
      salesDate: parkingSpace.salesDate,
      buyer: parkingSpace.buyer,
      salesId: parkingSpace.salesId,
      remark: parkingSpace.remark,
      createdAt: parkingSpace.createdAt,
      updatedAt: parkingSpace.updatedAt
    })
  } catch (error) {
    console.error('獲取停車位詳情失敗:', error)
    return NextResponse.json({ error: '獲取停車位詳情失敗' }, { status: 500 })
  }
}