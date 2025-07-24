import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    // 获取基础销售数据
    const salesData = await prisma.salesControl.findMany({
      where: {
        projectId: projectId
      },
      include: {
        salesPersonnel: {
          select: {
            name: true
          }
        }
      }
    })

    // 计算统计数据
    const stats = calculateStats(salesData)
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error in sales stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateStats(data: any[]) {
  const totalUnits = data.length
  const soldUnits = data.filter(item => item.salesStatus === 'SOLD').length
  const depositUnits = data.filter(item => item.salesStatus === 'DEPOSIT').length
  const availableUnits = data.filter(item => item.salesStatus === 'AVAILABLE').length
  const notForSaleUnits = data.filter(item => item.salesStatus === 'NOT_SALE').length
  
  const salesRate = totalUnits > 0 ? ((soldUnits + depositUnits) / totalUnits * 100) : 0
  
  // 计算总销售金额
  const totalSalesAmount = data
    .filter(item => item.salesStatus === 'SOLD' || item.salesStatus === 'DEPOSIT')
    .reduce((sum, item) => {
      const totalPrice = parseFloat(item.totalWithParking || item.houseTotal || '0')
      return sum + totalPrice
    }, 0)
  
  // 计算平均单价
  const soldAndDepositUnits = data.filter(item => item.salesStatus === 'SOLD' || item.salesStatus === 'DEPOSIT')
  const averageUnitPrice = soldAndDepositUnits.length > 0 
    ? soldAndDepositUnits.reduce((sum, item) => sum + parseFloat(item.unitPrice || '0'), 0) / soldAndDepositUnits.length
    : 0

  // 销售状态分布
  const statusDistribution = [
    { name: '售出', value: soldUnits, color: '#52c41a' },
    { name: '訂金', value: depositUnits, color: '#faad14' },
    { name: '未售出', value: availableUnits, color: '#d9d9d9' },
    { name: '不銷售', value: notForSaleUnits, color: '#ff4d4f' }
  ]

  // 按楼栋统计
  const buildingStats = data.reduce((acc, item) => {
    const building = item.building || '未知楼栋'
    if (!acc[building]) {
      acc[building] = { building, total: 0, sold: 0, deposit: 0, available: 0, notForSale: 0 }
    }
    acc[building].total++
    if (item.salesStatus === 'SOLD') acc[building].sold++
    else if (item.salesStatus === 'DEPOSIT') acc[building].deposit++
    else if (item.salesStatus === 'AVAILABLE') acc[building].available++
    else if (item.salesStatus === 'NOT_SALE') acc[building].notForSale++
    return acc
  }, {} as Record<string, any>)

  // 按月份统计销售趋势
  const monthlySales = data
    .filter(item => item.depositDate && (item.salesStatus === 'SOLD' || item.salesStatus === 'DEPOSIT'))
    .reduce((acc, item) => {
      const date = new Date(item.depositDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, count: 0, amount: 0 }
      }
      acc[monthKey].count++
      acc[monthKey].amount += parseFloat(item.totalWithParking || item.houseTotal || '0')
      return acc
    }, {} as Record<string, any>)

  // 销售人员业绩统计
  const salesPersonStats = data
    .filter(item => item.salesPersonnel?.name && (item.salesStatus === 'SOLD' || item.salesStatus === 'DEPOSIT'))
    .reduce((acc, item) => {
      const person = item.salesPersonnel.name
      if (!acc[person]) {
        acc[person] = { name: person, count: 0, amount: 0 }
      }
      acc[person].count++
      acc[person].amount += parseFloat(item.totalWithParking || item.houseTotal || '0')
      return acc
    }, {} as Record<string, any>)

  // 价格区间分布
  const priceRanges = [
    { range: '0-500万', min: 0, max: 5000000, count: 0 },
    { range: '500-1000万', min: 5000000, max: 10000000, count: 0 },
    { range: '1000-1500万', min: 10000000, max: 15000000, count: 0 },
    { range: '1500-2000万', min: 15000000, max: 20000000, count: 0 },
    { range: '2000万以上', min: 20000000, max: Infinity, count: 0 }
  ]

  data.forEach(item => {
    if (item.salesStatus === 'SOLD' || item.salesStatus === 'DEPOSIT') {
      const price = parseFloat(item.totalWithParking || item.houseTotal || '0')
      const range = priceRanges.find(r => price >= r.min && price < r.max)
      if (range) range.count++
    }
  })

  // 面积分布统计
  const areaRanges = [
    { range: '20坪以下', min: 0, max: 20, count: 0 },
    { range: '20-30坪', min: 20, max: 30, count: 0 },
    { range: '30-40坪', min: 30, max: 40, count: 0 },
    { range: '40-50坪', min: 40, max: 50, count: 0 },
    { range: '50坪以上', min: 50, max: Infinity, count: 0 }
  ]

  data.forEach(item => {
    const area = parseFloat(item.area || '0')
    const range = areaRanges.find(r => area >= r.min && area < r.max)
    if (range) range.count++
  })

  return {
    overview: {
      totalUnits,
      soldUnits,
      depositUnits,
      availableUnits,
      notForSaleUnits,
      salesRate: Math.round(salesRate * 100) / 100,
      totalSalesAmount,
      averageUnitPrice: Math.round(averageUnitPrice)
    },
    statusDistribution,
    buildingStats: Object.values(buildingStats),
    monthlySales: Object.values(monthlySales).sort((a: any, b: any) => a.month.localeCompare(b.month)),
    salesPersonStats: Object.values(salesPersonStats).sort((a: any, b: any) => b.amount - a.amount),
    priceDistribution: priceRanges.filter(r => r.count > 0),
    areaDistribution: areaRanges.filter(r => r.count > 0)
  }
}