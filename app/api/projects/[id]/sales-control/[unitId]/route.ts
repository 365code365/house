import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PUT - 更新銷控記錄
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const unitId = parseInt(params.unitId)
    const body = await request.json()
    
    // 驗證銷控記錄是否存在且屬於該項目
    const existingUnit = await prisma.salesControl.findFirst({
      where: {
        id: unitId,
        projectId: projectId
      }
    })
    
    if (!existingUnit) {
      return NextResponse.json({ error: '銷控記錄不存在' }, { status: 404 })
    }
    
    // 構建更新數據對象
    const updateData: any = {}
    
    // 根據實際的數據庫字段名進行映射
    if (body.building !== undefined) {
      updateData.building = body.building
    }
    if (body.floor !== undefined) {
      updateData.floor = body.floor
    }
    if (body.house_no !== undefined) {
      updateData.houseNo = body.house_no
    }
    if (body.unit !== undefined) {
      updateData.unit = body.unit
    }
    if (body.area !== undefined) {
      updateData.area = body.area ? parseFloat(body.area) : null
    }
    if (body.unit_price !== undefined) {
      updateData.unitPrice = body.unit_price ? parseFloat(body.unit_price) : null
    }
    if (body.house_total !== undefined) {
      updateData.houseTotal = body.house_total ? parseFloat(body.house_total) : null
    }
    if (body.total_with_parking !== undefined) {
      updateData.totalWithParking = body.total_with_parking ? parseFloat(body.total_with_parking) : null
    }
    if (body.sales_status !== undefined) {
      // 將前端的中文狀態轉換為枚舉值
      const statusMap: { [key: string]: string } = {
        '售出': 'SOLD',
        '訂金': 'DEPOSIT',
        '不銷售': 'NOT_SALE',
        '未售出': 'AVAILABLE',
        '可售': 'AVAILABLE'
      }
      updateData.salesStatus = statusMap[body.sales_status] || body.sales_status
    }
    if (body.buyer !== undefined) {
      updateData.buyer = body.buyer || null
    }
    if (body.sales_date !== undefined) {
      updateData.salesDate = body.sales_date ? new Date(body.sales_date) : null
    }
    if (body.deposit_date !== undefined) {
      updateData.depositDate = body.deposit_date ? new Date(body.deposit_date) : null
    }
    if (body.sign_date !== undefined) {
      updateData.signDate = body.sign_date ? new Date(body.sign_date) : null
    }
    if (body.sales_person_id !== undefined) {
      updateData.salesId = body.sales_person_id || null
    }
    if (body.parking_ids !== undefined) {
      updateData.parkingIds = body.parking_ids || null
    }
    if (body.custom_change !== undefined) {
      updateData.customChange = body.custom_change || false
    }
    if (body.custom_change_content !== undefined) {
      updateData.customChangeContent = body.custom_change_content || null
    }
    if (body.introducer !== undefined) {
      updateData.introducer = body.introducer || null
    }
    if (body.remark !== undefined) {
      updateData.notes = body.remark || null
    }
    if (body.base_price !== undefined) {
      updateData.basePrice = body.base_price ? parseFloat(body.base_price) : null
    }
    if (body.premium_rate !== undefined) {
      updateData.premiumRate = body.premium_rate ? parseFloat(body.premium_rate) : null
    }
    if (body.media_source !== undefined) {
      updateData.mediaSource = body.media_source || null
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '沒有要更新的字段' }, { status: 400 })
    }
    
    // 更新銷控記錄
    const updatedRecord = await prisma.salesControl.update({
      where: { id: unitId },
      data: updateData
    })
    
    // 返回更新後的記錄
    return NextResponse.json({
      id: updatedRecord.id,
      project_id: updatedRecord.projectId,
      building: updatedRecord.building,
      floor: updatedRecord.floor,
      unit: updatedRecord.unit,
      house_no: updatedRecord.houseNo,
      area: updatedRecord.area,
      unit_price: updatedRecord.unitPrice,
      house_total: updatedRecord.houseTotal,
      total_with_parking: updatedRecord.totalWithParking,
      sales_status: updatedRecord.salesStatus,
      sales_date: updatedRecord.salesDate,
      deposit_date: updatedRecord.depositDate,
      sign_date: updatedRecord.signDate,
      buyer: updatedRecord.buyer,
      sales_id: updatedRecord.salesId,
      parking_ids: updatedRecord.parkingIds,
      custom_change: updatedRecord.customChange,
      custom_change_content: updatedRecord.customChangeContent,
      introducer: updatedRecord.introducer,
      remark: updatedRecord.notes,
      base_price: updatedRecord.basePrice,
      premium_rate: updatedRecord.premiumRate,
      media_source: updatedRecord.mediaSource,
      created_at: updatedRecord.createdAt,
      updated_at: updatedRecord.updatedAt
    })
  } catch (error) {
    console.error('更新銷控記錄失敗:', error)
    return NextResponse.json({ error: '更新銷控記錄失敗' }, { status: 500 })
  }
}

// DELETE - 刪除銷控記錄
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const unitId = parseInt(params.unitId)
    
    // 驗證銷控記錄是否存在且屬於該項目
    const existingUnit = await prisma.salesControl.findFirst({
      where: {
        id: unitId,
        projectId: projectId
      }
    })
    
    if (!existingUnit) {
      return NextResponse.json({ error: '銷控記錄不存在' }, { status: 404 })
    }
    
    // 刪除銷控記錄
    await prisma.salesControl.delete({
      where: { id: unitId }
    })
    
    return NextResponse.json({ message: '銷控記錄已刪除' })
  } catch (error) {
    console.error('刪除銷控記錄失敗:', error)
    return NextResponse.json({ error: '刪除銷控記錄失敗' }, { status: 500 })
  }
}

// POST - 撤銷銷售（將狀態改為可售）
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const unitId = parseInt(params.unitId)
    
    // 驗證銷控記錄是否存在且屬於該項目
    const existingUnit = await prisma.salesControl.findFirst({
      where: {
        id: unitId,
        projectId: projectId
      }
    })
    
    if (!existingUnit) {
      return NextResponse.json({ error: '銷控記錄不存在' }, { status: 404 })
    }
    
    // 撤銷銷售：清除客戶信息，將狀態改為可售
    const updatedRecord = await prisma.salesControl.update({
      where: { id: unitId },
      data: {
        salesStatus: 'AVAILABLE',
        buyer: null,
        salesDate: null,
        depositDate: null,
        signDate: null,
        salesId: null,
        parkingIds: null,
        customChange: false,
        customChangeContent: null,
        introducer: null,
        notes: null
      }
    })
    
    // 返回更新後的記錄
    return NextResponse.json({
      id: updatedRecord.id,
      project_id: updatedRecord.projectId,
      building: updatedRecord.building,
      floor: updatedRecord.floor,
      unit: updatedRecord.unit,
      house_no: updatedRecord.houseNo,
      area: updatedRecord.area,
      unit_price: updatedRecord.unitPrice,
      house_total: updatedRecord.houseTotal,
      total_with_parking: updatedRecord.totalWithParking,
      sales_status: updatedRecord.salesStatus,
      sales_date: updatedRecord.salesDate,
      deposit_date: updatedRecord.depositDate,
      sign_date: updatedRecord.signDate,
      buyer: updatedRecord.buyer,
      sales_person_id: updatedRecord.salesId,
      parking_ids: updatedRecord.parkingIds,
      custom_change: updatedRecord.customChange,
      custom_change_content: updatedRecord.customChangeContent,
      introducer: updatedRecord.introducer,
      remark: updatedRecord.notes,
      created_at: updatedRecord.createdAt,
      updated_at: updatedRecord.updatedAt
    })
  } catch (error) {
    console.error('撤銷銷售失敗:', error)
    return NextResponse.json({ error: '撤銷銷售失敗' }, { status: 500 })
  }
}