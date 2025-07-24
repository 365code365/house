import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 獲取建案統計數據
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { message: '無效的建案ID' },
        { status: 400 }
      )
    }

    // 檢查建案是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { message: '建案不存在' },
        { status: 404 }
      )
    }

    // 獲取銷控統計
    const totalUnits = await prisma.salesControl.count({
      where: { projectId }
    })
    
    const soldUnits = await prisma.salesControl.count({
      where: { projectId, salesStatus: 'SOLD' }
    })
    
    const reservedUnits = await prisma.salesControl.count({
      where: { projectId, salesStatus: 'DEPOSIT' }
    })
    
    const availableUnits = await prisma.salesControl.count({
      where: { projectId, salesStatus: 'AVAILABLE' }
    })

    // 獲取停車位統計
    const totalParkingSpaces = await prisma.parkingSpace.count({
      where: { projectId }
    })
    
    const soldParkingSpaces = await prisma.parkingSpace.count({
      where: { projectId, salesStatus: 'SOLD' }
    })

    // 獲取客戶統計（假設有 PurchasedCustomer 模型）
    const totalCustomers = await prisma.purchasedCustomer.count({
      where: { projectId }
    })

    // 獲取預約統計
    const totalAppointments = await prisma.customerAppointment.count({
      where: { 
        projectId,
        status: { not: 'CANCELLED' }
      }
    })

    const stats = {
      totalUnits,
      soldUnits,
      reservedUnits,
      availableUnits,
      totalParkingSpaces,
      soldParkingSpaces,
      totalCustomers,
      totalAppointments
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('獲取建案統計失敗:', error)
    return NextResponse.json(
      { message: '獲取建案統計失敗' },
      { status: 500 }
    )
  }
}