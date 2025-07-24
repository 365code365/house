import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PUT - 更新停車位
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; spaceId: string } }
) {
  try {
    const { id: projectId, spaceId } = params
    const body = await request.json()
    const {
      spaceNumber,
      spaceType,
      location,
      price,
      status,
      customerName,
      salesPerson,
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
      return NextResponse.json({ error: '停車位不存在' }, { status: 404 })
    }
    
    // 檢查車位編號是否重複（排除當前記錄）
    const duplicateSpace = await prisma.parkingSpace.findFirst({
      where: {
        projectId: parseInt(projectId),
        parkingNo: spaceNumber,
        id: { not: parseInt(spaceId) }
      }
    })
      
    if (duplicateSpace) {
      return NextResponse.json({ error: '該車位編號已存在' }, { status: 400 })
    }
    
    await prisma.parkingSpace.update({
      where: { id: parseInt(spaceId) },
      data: {
        parkingNo: spaceNumber,
        type: spaceType as any,
        location: location,
        price: parseFloat(price),
        salesStatus: status as any,
        buyer: customerName || null,
        salesId: salesPerson || null,
        salesDate: contractDate ? new Date(contractDate) : null
      }
    })
    
    return NextResponse.json({ message: '停車位已更新' })
  } catch (error) {
    console.error('更新停車位失敗:', error)
    return NextResponse.json({ error: '更新停車位失敗' }, { status: 500 })
  }
}

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
    
    // 轉換為前端期望的格式
    return NextResponse.json({
      id: parkingSpace.id,
      space_number: parkingSpace.parkingNo,
      space_type: parkingSpace.type,
      location: parkingSpace.location,
      price: parkingSpace.price,
      status: parkingSpace.salesStatus,
      customer_name: parkingSpace.buyer,
      sales_person: parkingSpace.salesId,
      contract_date: parkingSpace.salesDate,
      created_at: parkingSpace.createdAt,
      updated_at: parkingSpace.updatedAt
    })
  } catch (error) {
    console.error('獲取停車位詳情失敗:', error)
    return NextResponse.json({ error: '獲取停車位詳情失敗' }, { status: 500 })
  }
}