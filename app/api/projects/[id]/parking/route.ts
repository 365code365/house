import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ParkingSpace } from '@/lib/db'

// GET - 獲取項目的停車位數據
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: parseInt(projectId) }
    })
    
    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
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
    
    const parkingSpaces = await prisma.parkingSpace.findMany({
      where: whereConditions,
      orderBy: {
        parkingNo: 'asc'
      }
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
    
    return NextResponse.json(formattedSpaces)
  } catch (error) {
    console.error('獲取停車位數據失敗:', error)
    return NextResponse.json({ error: '獲取停車位數據失敗' }, { status: 500 })
  }
}

// POST - 創建新的停車位
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: parseInt(projectId) }
    })
    
    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 檢查車位編號是否已存在
    const existingSpace = await prisma.parkingSpace.findFirst({
      where: {
        projectId: parseInt(projectId),
        parkingNo: spaceNumber
      }
    })
    
    if (existingSpace) {
      return NextResponse.json({ error: '該車位編號已存在' }, { status: 400 })
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
    return NextResponse.json({
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
    }, { status: 201 })
  } catch (error) {
    console.error('創建停車位失敗:', error)
    return NextResponse.json({ error: '創建停車位失敗' }, { status: 500 })
  }
}