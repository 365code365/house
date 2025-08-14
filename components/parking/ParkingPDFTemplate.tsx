"use client"

import React from 'react'

interface ParkingSpace {
  id: number
  spaceNumber: string
  type: string
  location: string
  price: number
  status: string
  customerName?: string
  salesPerson?: string
  contractDate?: string
}

interface ParkingPDFTemplateProps {
  data: ParkingSpace[]
  config?: {
    title?: string
    subtitle?: string
    companyName?: string
    headerColor?: string
    accentColor?: string
    showSummary?: boolean
    showDate?: boolean
    pageOrientation?: 'portrait' | 'landscape'
    fontSize?: 'small' | 'medium' | 'large'
  }
}

interface ParkingPDFTemplateRef {
  getElement: () => HTMLDivElement | null
}

const ParkingPDFTemplate = React.forwardRef<ParkingPDFTemplateRef, ParkingPDFTemplateProps>((
  { data, config = {} }, ref
) => {
  const elementRef = React.useRef<HTMLDivElement>(null)

  React.useImperativeHandle(ref, () => ({
    getElement: () => elementRef.current
  }))

  const {
    title = '停車位管理報表',
    subtitle = '項目停車位使用情況統計',
    companyName = '房地產停車位管理系統',
    headerColor = '#1890ff',
    accentColor = '#1890ff',
    showSummary = true,
    showDate = true,
    pageOrientation = 'landscape',
    fontSize = 'medium'
  } = config

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '可售'
      case 'sold': return '已售'
      case 'reserved': return '預約'
      case 'maintenance': return '維護中'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold': return '#52c41a'
      case 'reserved': return '#fa8c16'
      case 'available': return '#1890ff'
      case 'maintenance': return '#f5222d'
      default: return '#666'
    }
  }

  // 统计数据
  const safeData = Array.isArray(data) ? data : []
  const totalSpaces = safeData.length
  const availableSpaces = safeData.filter(item => item.status === 'available').length
  const soldSpaces = safeData.filter(item => item.status === 'sold').length
  const reservedSpaces = safeData.filter(item => item.status === 'reserved').length
  const maintenanceSpaces = safeData.filter(item => item.status === 'maintenance').length
  const totalValue = safeData.reduce((sum, item) => sum + item.price, 0)
  const soldValue = safeData.filter(item => item.status === 'sold').reduce((sum, item) => sum + item.price, 0)
  const occupancyRate = totalSpaces > 0 ? ((soldSpaces + reservedSpaces) / totalSpaces) * 100 : 0

  return (
    <div 
      ref={elementRef}
      style={{
        width: pageOrientation === 'landscape' ? '297mm' : '210mm',
        minHeight: pageOrientation === 'landscape' ? '210mm' : '297mm',
        padding: '20mm',
        backgroundColor: 'white',
        fontFamily: '"Microsoft JhengHei", "PingFang TC", "Helvetica Neue", Arial, sans-serif',
        fontSize: fontSize === 'small' ? '10px' : fontSize === 'large' ? '14px' : '12px',
        lineHeight: '1.4',
        color: '#333',
        boxSizing: 'border-box'
      }}
    >
      {/* 頁眉 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: `3px solid ${headerColor}`,
        position: 'relative'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 'bold',
            color: headerColor,
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            {title}
          </h1>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '16px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            {subtitle}
          </p>
        </div>
        <div style={{ 
          textAlign: 'right',
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: headerColor
          }}>
            {companyName}
          </div>
          {showDate && (
            <div style={{
              fontSize: '14px',
              color: '#666',
              borderTop: '1px solid #dee2e6',
              paddingTop: '8px'
            }}>
              報表生成時間：{formatDate(new Date())}
            </div>
          )}
        </div>
      </div>

      {/* 統計摘要 */}
      {showSummary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '15px',
          marginBottom: '35px'
        }}>
          <div style={{
            padding: '20px 15px',
            backgroundColor: '#e6f7ff',
            borderRadius: '12px',
            textAlign: 'center',
            border: '2px solid #91d5ff',
            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.15)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
              {totalSpaces}
            </div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
              總車位數
            </div>
          </div>
          <div style={{
            padding: '20px 15px',
            backgroundColor: '#f6ffed',
            borderRadius: '12px',
            textAlign: 'center',
            border: '2px solid #b7eb8f',
            boxShadow: '0 2px 8px rgba(82, 196, 26, 0.15)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a', marginBottom: '8px' }}>
              {soldSpaces}
            </div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
              已售車位
            </div>
          </div>
          <div style={{
            padding: '20px 15px',
            backgroundColor: '#fff7e6',
            borderRadius: '12px',
            textAlign: 'center',
            border: '2px solid #ffd591',
            boxShadow: '0 2px 8px rgba(250, 140, 22, 0.15)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fa8c16', marginBottom: '8px' }}>
              {reservedSpaces}
            </div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
              預約車位
            </div>
          </div>
          <div style={{
            padding: '20px 15px',
            backgroundColor: '#f0f9ff',
            borderRadius: '12px',
            textAlign: 'center',
            border: '2px solid #91d5ff',
            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.15)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
              {availableSpaces}
            </div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
              可售車位
            </div>
          </div>
          <div style={{
            padding: '20px 15px',
            backgroundColor: '#fff2f0',
            borderRadius: '12px',
            textAlign: 'center',
            border: '2px solid #ffccc7',
            boxShadow: '0 2px 8px rgba(245, 34, 45, 0.15)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f5222d', marginBottom: '8px' }}>
              {maintenanceSpaces}
            </div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
              維護中
            </div>
          </div>
        </div>
      )}

      {/* 停車位概況 */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{
          margin: '0 0 15px 0',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          停車位概況
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '5px' }}>使用率</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              {occupancyRate.toFixed(1)}%
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '5px' }}>總價值</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
              {formatCurrency(totalValue)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '5px' }}>已售價值</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
              {formatCurrency(soldValue)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '5px' }}>平均單價</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
              {totalSpaces > 0 ? formatCurrency(totalValue / totalSpaces) : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 詳細停車位列表 */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#333',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '10px'
        }}>
          詳細停車位列表
        </h2>
        
        {safeData.length > 0 ? (
          <div style={{
            overflow: 'auto',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '10px',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: headerColor,
                  color: 'white'
                }}>
                  <th style={{ padding: '10px 6px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>車位編號</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>類型</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>位置</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>價格</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>狀態</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>客戶姓名</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>銷售人員</th>
                  <th style={{ padding: '10px 6px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>合約日期</th>
                </tr>
              </thead>
              <tbody>
                {safeData.map((item, index) => (
                  <tr key={index} style={{
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                  }}>
                    <td style={{ padding: '8px 6px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: '500' }}>
                      {item.spaceNumber}
                    </td>
                    <td style={{ padding: '8px 6px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {item.type}
                    </td>
                    <td style={{ padding: '8px 6px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {item.location}
                    </td>
                    <td style={{ 
                      padding: '8px 6px', 
                      border: '1px solid #dee2e6', 
                      textAlign: 'right', 
                      fontFamily: 'monospace',
                      fontWeight: '500'
                    }}>
                      {formatCurrency(item.price)}
                    </td>
                    <td style={{ 
                      padding: '8px 6px', 
                      border: '1px solid #dee2e6', 
                      textAlign: 'center',
                      color: getStatusColor(item.status),
                      fontWeight: 'bold'
                    }}>
                      {getStatusText(item.status)}
                    </td>
                    <td style={{ padding: '8px 6px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {item.customerName || '-'}
                    </td>
                    <td style={{ padding: '8px 6px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {item.salesPerson || '-'}
                    </td>
                    <td style={{ padding: '8px 6px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {item.contractDate || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: '#999',
            fontSize: '16px',
            border: '2px dashed #dee2e6',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚗</div>
            暫無停車位數據
          </div>
        )}
      </div>

      {/* 頁腳 */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '2px solid #e9ecef',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: '#666',
        backgroundColor: '#f8f9fa',
        padding: '15px 20px',
        borderRadius: '8px'
      }}>
        <div style={{ fontWeight: '500' }}>
          © {new Date().getFullYear()} {companyName} - 停車位管理系統
        </div>
        <div style={{ fontWeight: '500' }}>
          第 1 頁，共 1 頁
        </div>
      </div>
    </div>
  )
})

ParkingPDFTemplate.displayName = 'ParkingPDFTemplate'

export default ParkingPDFTemplate
