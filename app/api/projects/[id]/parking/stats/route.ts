import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

// GET - 獲取停車位統計數據
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
    
    // 驗證項目是否存在
    const projectExists = await executeQuery(
      'SELECT id FROM projects WHERE id = ?',
      [projectId]
    )
    
    if (!Array.isArray(projectExists) || projectExists.length === 0) {
      return NextResponse.json({ error: '項目不存在' }, { status: 404 })
    }
    
    // 獲取停車位統計數據
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold,
        COALESCE(SUM(CASE WHEN status = 'sold' THEN price ELSE 0 END), 0) as totalRevenue,
        COALESCE(AVG(CASE WHEN status = 'sold' THEN price END), 0) as averagePrice
      FROM parking_spaces 
      WHERE project_id = ?
    `
    
    const statsResult = await executeQuery(statsQuery, [projectId])
    const stats = Array.isArray(statsResult) ? statsResult[0] : statsResult
    
    // 獲取按類型分組的統計
    const typeStatsQuery = `
      SELECT 
        type,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold,
        COALESCE(SUM(CASE WHEN status = 'sold' THEN price ELSE 0 END), 0) as revenue
      FROM parking_spaces 
      WHERE project_id = ?
      GROUP BY type
      ORDER BY type
    `
    
    const typeStats = await executeQuery(typeStatsQuery, [projectId])
    
    // 獲取按狀態分組的統計
    const statusStatsQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(price), 0) as totalValue
      FROM parking_spaces 
      WHERE project_id = ?
      GROUP BY status
      ORDER BY status
    `
    
    const statusStats = await executeQuery(statusStatsQuery, [projectId])
    
    // 獲取最近的銷售記錄
    const recentSalesQuery = `
      SELECT 
        space_number as spaceNumber,
        type,
        price,
        customer_name as customerName,
        sales_person as salesPerson,
        contract_date as contractDate
      FROM parking_spaces 
      WHERE project_id = ? AND status = 'sold' AND contract_date IS NOT NULL
      ORDER BY contract_date DESC
      LIMIT 10
    `
    
    const recentSales = await executeQuery(recentSalesQuery, [projectId])
    
    // 獲取價格分布統計
    const priceRangeQuery = `
      SELECT 
        CASE 
          WHEN price < 100000 THEN '10萬以下'
          WHEN price < 200000 THEN '10-20萬'
          WHEN price < 300000 THEN '20-30萬'
          WHEN price < 500000 THEN '30-50萬'
          ELSE '50萬以上'
        END as priceRange,
        COUNT(*) as count
      FROM parking_spaces 
      WHERE project_id = ?
      GROUP BY 
        CASE 
          WHEN price < 100000 THEN '10萬以下'
          WHEN price < 200000 THEN '10-20萬'
          WHEN price < 300000 THEN '20-30萬'
          WHEN price < 500000 THEN '30-50萬'
          ELSE '50萬以上'
        END
      ORDER BY MIN(price)
    `
    
    const priceDistribution = await executeQuery(priceRangeQuery, [projectId])
    
    const response = {
      overview: {
        total: Number(stats.total) || 0,
        available: Number(stats.available) || 0,
        reserved: Number(stats.reserved) || 0,
        sold: Number(stats.sold) || 0,
        totalRevenue: Number(stats.totalRevenue) || 0,
        averagePrice: Number(stats.averagePrice) || 0,
        salesRate: stats.total > 0 ? ((Number(stats.sold) / Number(stats.total)) * 100).toFixed(2) : '0.00'
      },
      byType: Array.isArray(typeStats) ? typeStats.map((item: any) => ({
        type: item.type,
        total: Number(item.total),
        available: Number(item.available),
        reserved: Number(item.reserved),
        sold: Number(item.sold),
        revenue: Number(item.revenue)
      })) : [],
      byStatus: Array.isArray(statusStats) ? statusStats.map((item: any) => ({
        status: item.status,
        count: Number(item.count),
        totalValue: Number(item.totalValue)
      })) : [],
      recentSales: Array.isArray(recentSales) ? recentSales : [],
      priceDistribution: Array.isArray(priceDistribution) ? priceDistribution.map((item: any) => ({
        priceRange: item.priceRange,
        count: Number(item.count)
      })) : []
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('獲取停車位統計數據失敗:', error)
    return NextResponse.json({ error: '獲取停車位統計數據失敗' }, { status: 500 })
  }
}