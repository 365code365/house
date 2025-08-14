import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { SalesControl } from '@/lib/db'

// GET - 獲取項目的銷控數據
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const building = searchParams.get('building')
    const salesStatus = searchParams.get('salesStatus')
    const search = searchParams.get('searchTerm')
    const salesPerson = searchParams.get('salesPerson')
    const mediaSource = searchParams.get('mediaSource')
    const customChange = searchParams.get('customChange')
    const buyer = searchParams.get('buyer')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minArea = searchParams.get('minArea')
    const maxArea = searchParams.get('maxArea')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // 分頁參數
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const skip = (page - 1) * pageSize
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 構建查詢條件
    const whereConditions: any = {
      projectId: projectId
    }
    
    if (building) {
      whereConditions.building = building
    }
    
    if (salesStatus) {
      // 將前端的中文狀態轉換為枚舉值
      const statusMap: { [key: string]: string } = {
        '售出': 'SOLD',
        '訂金': 'DEPOSIT',
        '不銷售': 'NOT_SALE',
        '未售出': 'AVAILABLE'
      }
      whereConditions.salesStatus = statusMap[salesStatus] || salesStatus
    }
    
    if (mediaSource) {
      whereConditions.mediaSource = { contains: mediaSource }
    }
    
    if (customChange) {
      whereConditions.customChange = customChange
    }
    
    if (buyer) {
      whereConditions.buyer = { contains: buyer }
    }
    
    // 价格范围筛选
    if (minPrice || maxPrice) {
      whereConditions.unitPrice = {}
      if (minPrice) whereConditions.unitPrice.gte = parseFloat(minPrice)
      if (maxPrice) whereConditions.unitPrice.lte = parseFloat(maxPrice)
    }
    
    // 面积范围筛选
    if (minArea || maxArea) {
      whereConditions.area = {}
      if (minArea) whereConditions.area.gte = parseFloat(minArea)
      if (maxArea) whereConditions.area.lte = parseFloat(maxArea)
    }
    
    // 日期范围筛选
    if (startDate || endDate) {
      whereConditions.depositDate = {}
      if (startDate) whereConditions.depositDate.gte = new Date(startDate)
      if (endDate) whereConditions.depositDate.lte = new Date(endDate)
    }
    
    // 销售人员筛选
    if (salesPerson) {
      whereConditions.salesPersonnel = {
        name: { contains: salesPerson }
      }
    }
    
    if (search) {
      whereConditions.OR = [
        { houseNo: { contains: search } },
        { unit: { contains: search } },
        { buyer: { contains: search } }
      ]
    }
    
    // 獲取總數
    const total = await prisma.salesControl.count({
      where: whereConditions
    })
    
    // 獲取銷控數據，包含關聯的銷售人員信息
    const salesControl = await prisma.salesControl.findMany({
      where: whereConditions,
      include: {
        salesPersonnel: {
          select: {
            name: true,
            employeeNo: true
          }
        }
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { houseNo: 'asc' }
      ],
      skip: skip,
      take: pageSize
    })
    
    // 為每條記錄獲取停車位詳細信息
    const salesControlWithParkingDetails = await Promise.all(
      salesControl.map(async (record) => {
        let parkingSpaces: any[] = []
        
        if (record.parkingIds) {
          const parkingIdArray = record.parkingIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
          
          if (parkingIdArray.length > 0) {
            const parkingResult = await prisma.parkingSpace.findMany({
              where: {
                id: { in: parkingIdArray },
                projectId: projectId
              },
              select: {
                id: true,
                parkingNo: true,
                type: true,
                price: true,
                salesStatus: true,
                salesDate: true,
                buyer: true,
                remark: true
              }
            })
            parkingSpaces = parkingResult
          }
        }
        
        return {
          id: record.id,
          project_id: record.projectId,
          building: record.building,
          floor: record.floor,
          unit: record.unit,
          house_no: record.houseNo,
          area: record.area,
          unit_price: record.unitPrice,
          house_total: record.houseTotal,
          total_with_parking: record.totalWithParking,
          base_price: record.basePrice,
          premium_rate: record.premiumRate,
          sales_status: record.salesStatus,
          sales_date: record.salesDate,
          deposit_date: record.depositDate,
          sign_date: record.signDate,
          buyer: record.buyer,
          sales_id: record.salesId,
          sales_person_name: record.salesPersonnel?.name,
          sales_person_employee_no: record.salesPersonnel?.employeeNo,
          parking_ids: record.parkingIds,
          custom_change: record.customChange,
          custom_change_content: record.customChangeContent,
          media_source: record.mediaSource,
          introducer: record.introducer,
          notes: record.notes,
          created_at: record.createdAt,
          updated_at: record.updatedAt,
          parking_spaces: parkingSpaces
        }
      })
    )
    
    return NextResponse.json({
      data: salesControlWithParkingDetails,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('獲取銷控數據失敗:', error)
    return NextResponse.json({ error: '獲取銷控數據失敗' }, { status: 500 })
  }
}

// POST - 創建新的銷控記錄
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params.id)
    const body = await request.json()
    const {
      building,
      floor,
      houseNo,
      unit,
      area,
      unitPrice,
      houseTotal,
      totalWithParking,
      salesStatus = 'AVAILABLE',
      salesDate,
      depositDate,
      signDate,
      buyer,
      salesId,
      parkingIds,
      customChange,
      customChangeContent,
      mediaSource,
      introducer,
      notes,
      basePrice,
      premiumRate
    } = body

    // 驗證必填字段
    if (!building || floor === undefined || !houseNo || !unit) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    
    // 驗證項目是否存在
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!projectExists) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }

    // 檢查戶號是否已存在
    const existingUnit = await prisma.salesControl.findFirst({
      where: {
        projectId,
        building,
        floor,
        houseNo
      }
    })
    
    if (existingUnit) {
      return NextResponse.json({ error: '該戶號已存在' }, { status: 400 })
    }
    
    // 將前端的中文狀態轉換為枚舉值
    const statusMap: { [key: string]: string } = {
      '售出': 'SOLD',
      '訂金': 'DEPOSIT',
      '不銷售': 'NOT_SALE',
      '未售出': 'AVAILABLE'
    }
    const mappedSalesStatus = statusMap[salesStatus] || salesStatus
    
    // 創建銷控記錄
    const newRecord = await prisma.salesControl.create({
      data: {
        projectId,
        building,
        floor,
        houseNo,
        unit,
        area: area ? parseFloat(area) : null,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        houseTotal: houseTotal ? parseFloat(houseTotal) : null,
        totalWithParking: totalWithParking ? parseFloat(totalWithParking) : null,
        salesStatus: mappedSalesStatus as any,
        salesDate: salesDate ? new Date(salesDate) : null,
        depositDate: depositDate ? new Date(depositDate) : null,
        signDate: signDate ? new Date(signDate) : null,
        buyer: buyer || null,
        salesId: salesId || null,
        parkingIds: parkingIds || null,
        customChange: customChange || false,
        customChangeContent: customChangeContent || null,
        mediaSource: mediaSource || null,
        introducer: introducer || null,
        notes: notes || null,
        basePrice: basePrice ? parseFloat(basePrice) : null,
        premiumRate: premiumRate ? parseFloat(premiumRate) : null
      }
    })
    
    // 返回創建的記錄
    return NextResponse.json({
      id: newRecord.id,
      projectId: newRecord.projectId,
      building: newRecord.building,
      floor: newRecord.floor,
      houseNo: newRecord.houseNo,
      unit: newRecord.unit,
      area: newRecord.area,
      unit_price: newRecord.unitPrice,
      house_total: newRecord.houseTotal,
      total_with_parking: newRecord.totalWithParking,
      status: newRecord.salesStatus,
      sales_date: newRecord.salesDate,
      deposit_date: newRecord.depositDate,
      sign_date: newRecord.signDate,
      buyer: newRecord.buyer,
      sales_id: newRecord.salesId,
      parking_ids: newRecord.parkingIds,
      custom_change: newRecord.customChange,
      custom_change_content: newRecord.customChangeContent,
      media_source: newRecord.mediaSource,
      introducer: newRecord.introducer,
      notes: newRecord.notes,
      base_price: newRecord.basePrice,
      premium_rate: newRecord.premiumRate,
      createdAt: newRecord.createdAt,
      updatedAt: newRecord.updatedAt
    }, { status: 201 })
    
  } catch (error) {
    console.error('創建銷控記錄失敗:', error)
    return NextResponse.json({ error: '創建銷控記錄失敗' }, { status: 500 })
  }
}