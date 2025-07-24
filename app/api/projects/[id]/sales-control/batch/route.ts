import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const { data: importData } = await request.json()
    
    if (!Array.isArray(importData) || importData.length === 0) {
      return NextResponse.json({ error: 'Invalid import data' }, { status: 400 })
    }

    // 验证数据格式
    const validatedData = importData.map((item, index) => {
      if (!item.house_number) {
        throw new Error(`第${index + 1}行: 房屋编号不能为空`)
      }
      if (!item.building) {
        throw new Error(`第${index + 1}行: 楼栋不能为空`)
      }
      
      // 状态映射
      const statusMap: { [key: string]: string } = {
        '售出': 'SOLD',
        '订金': 'DEPOSIT',
        '不销售': 'NOT_SALE',
        '未售出': 'AVAILABLE'
      }
      const salesStatus = statusMap[item.sales_status] || item.sales_status || 'AVAILABLE'
      
      return {
        projectId: projectId,
        houseNo: item.house_number,
        building: item.building,
        floor: item.floor || null,
        unit: item.house_type || null,
        area: item.area ? parseFloat(item.area) : null,
        salesStatus: salesStatus as any,
        unitPrice: item.unit_price ? parseFloat(item.unit_price) : null,
        houseTotal: item.house_total ? parseFloat(item.house_total) : null,
        parkingIds: item.parking_spaces || null,
        basePrice: item.base_price ? parseFloat(item.base_price) : null,
        premiumRate: item.premium_rate ? parseFloat(item.premium_rate) : null,
        totalWithParking: item.total_with_parking ? parseFloat(item.total_with_parking) : null,
        buyer: item.buyer || null,
        depositDate: item.deposit_date ? new Date(item.deposit_date) : null,
        signDate: item.sign_date ? new Date(item.sign_date) : null,
        salesId: item.sales_person_id || null,
        mediaSource: item.media_source || null,
        introducer: item.introducer || null,
        customChangeContent: item.custom_change_content || null,
        notes: item.notes || null
      }
    })

    // 使用 Prisma 批量创建，处理重复数据
    const results = []
    const errors = []
    
    for (const data of validatedData) {
      try {
        // 检查是否已存在
        const existing = await prisma.salesControl.findFirst({
          where: {
            projectId: data.projectId,
            houseNo: data.houseNo,
            building: data.building
          }
        })
        
        let result
        if (existing) {
          // 更新现有记录
          result = await prisma.salesControl.update({
            where: { id: existing.id },
            data
          })
        } else {
          // 创建新记录
          result = await prisma.salesControl.create({
            data
          })
        }
        results.push(result)
      } catch (error) {
        console.error('Record processing error:', error)
        errors.push(`Failed to process record ${data.houseNo}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: `Successfully processed ${results.length} records${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Batch import API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}

// 批量更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const { updates } = await request.json()
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Invalid update data' }, { status: 400 })
    }

    const results = []
    const errors = []

    // 逐个更新记录
    for (const update of updates) {
      try {
        const { id, ...updateData } = update
        
        if (!id) {
          errors.push('Missing record ID')
          continue
        }

        const result = await prisma.salesControl.update({
          where: {
            id: parseInt(id),
            projectId: projectId
          },
          data: updateData
        })
        
        results.push(result)
      } catch (error) {
        errors.push(`Error processing record ${update.id}: ${(error as Error).message}`)
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: `Updated ${results.length} records${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Batch update API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}

// 批量删除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const { ids } = await request.json()
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid delete data' }, { status: 400 })
    }

    // 先获取要删除的记录
    const recordsToDelete = await prisma.salesControl.findMany({
      where: {
        projectId: projectId,
        id: { in: ids.map((id: any) => parseInt(id)) }
      }
    })
    
    // 执行删除操作
    const deleteResult = await prisma.salesControl.deleteMany({
      where: {
        projectId: projectId,
        id: { in: ids.map((id: any) => parseInt(id)) }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} records`,
      data: recordsToDelete
    })
  } catch (error) {
    console.error('Batch delete API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}