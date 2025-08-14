"use client"

import React from 'react'
import { SalesControlData } from './SalesControlTable'
import { PDFConfig } from './PDFTemplateConfig'

interface PDFTemplateProps {
  data: SalesControlData[]
  config?: Partial<PDFConfig>
}

interface PDFTemplateRef {
  getElement: () => HTMLDivElement | null
}

const PDFTemplate = React.forwardRef<PDFTemplateRef, PDFTemplateProps>((
  { data, config = {} }, ref
) => {
  const elementRef = React.useRef<HTMLDivElement>(null)

  // 添加調試日誌
  React.useEffect(() => {
    console.log('PDFTemplate渲染，接收到的數據:', {
      dataLength: data?.length || 0,
      config,
      firstItem: data?.[0]
    })
  }, [data, config])

  React.useImperativeHandle(ref, () => ({
    getElement: () => {
      console.log('PDFTemplate getElement被調用，元素:', elementRef.current)
      return elementRef.current
    }
  }))

  const {
    title = '銷控管理報表',
    subtitle = '房地產銷售控制數據統計',
    companyName = '房地產銷控管理系統',
    logoUrl,
    showDate = true,
    dateFormat = 'YYYY-MM-DD',
    showPageNumber = true,
    headerColor = '#1890ff',
    accentColor = '#1890ff',
    showSummary = true,
    showLogo = false,
    pageOrientation = 'landscape',
    fontSize = 'medium',
    tableStyle = 'striped',
    customStyles = {}
  } = config

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '可售'
      case 'reserved': return '預約'
      case 'sold': return '已售'
      case 'withdrawn': return '退戶'
      default: return status
    }
  }

  const formatCurrency = (value: string | number) => {
    if (!value) return ''
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(num)
  }

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
        boxSizing: 'border-box',
        ...customStyles
      }}
    >
      {/* 頁眉 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '15px',
        borderBottom: `2px solid ${headerColor}`
      }}>
        <div style={{ flex: 1 }}>
          {showLogo && logoUrl && (
            <img 
              src={logoUrl} 
              alt="Logo" 
              style={{
                height: '50px',
                marginBottom: '10px'
              }}
            />
          )}
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            color: headerColor
          }}>
            {title}
          </h1>
          <p style={{
            margin: '5px 0 0 0',
            fontSize: '14px',
            color: '#666'
          }}>
            {subtitle}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '5px'
          }}>
            {companyName}
          </div>
          {showDate && (
            <div style={{
              fontSize: '12px',
              color: '#666'
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
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #e1f5fe'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>
              {data.length}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              總戶數
            </div>
          </div>
          <div style={{
            padding: '15px',
            backgroundColor: '#f6ffed',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #d9f7be'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
              {data.filter(item => item.sales_status === 'sold').length}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              已售戶數
            </div>
          </div>
          <div style={{
            padding: '15px',
            backgroundColor: '#fff7e6',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #ffd591'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
              {data.filter(item => item.sales_status === 'reserved').length}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              預約戶數
            </div>
          </div>
          <div style={{
            padding: '15px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #e1f5fe'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>
              {data.filter(item => item.sales_status === 'available').length}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              可售戶數
            </div>
          </div>
        </div>
      )}

      {/* 數據表格 */}
      <div style={{
        marginBottom: '30px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '15px',
          color: '#333'
        }}>
          詳細數據列表
        </h2>
        
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '10px'
        }}>
          <thead>
            <tr style={{
              backgroundColor: headerColor,
              color: 'white'
            }}>
              <th style={{ padding: '8px 4px', border: '1px solid #ddd', textAlign: 'center' }}>棟別</th>
              <th style={{ padding: '8px 4px', border: '1px solid #ddd', textAlign: 'center' }}>樓層</th>
              <th style={{ padding: '8px 4px', border: '1px solid #ddd', textAlign: 'center' }}>戶號</th>
              <th style={{ padding: '8px 4px', border: '1px solid #ddd', textAlign: 'center' }}>戶型</th>
              <th style={{ padding: '8px 4px', border: '1px solid #ddd', textAlign: 'center' }}>面積</th>
              <th style={{ padding: '8px 4px', border: '1px solid #ddd', textAlign: 'center' }}>單價</th>
              <th style={{ padding: '8px 4px', border: '1px solid #ddd', textAlign: 'center' }}>總價</th>
              <th style={{ padding: '8px 4px', border: '1px solid #ddd', textAlign: 'center' }}>狀態</th>
              <th style={{ padding: '8px 4px', border: '1px solid #ddd', textAlign: 'center' }}>銷售人員</th>
              <th style={{ padding: '8px 4px', border: '1px solid #ddd', textAlign: 'center' }}>客戶</th>
              <th style={{ padding: '8px 4px', border: '1px solid #ddd', textAlign: 'center' }}>簽約日期</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} style={{
                backgroundColor: tableStyle === 'striped' ? 
                  (index % 2 === 0 ? '#fafafa' : 'white') : 'white',
                border: tableStyle === 'bordered' ? '1px solid #ddd' : 'none'
              }}>
                <td style={{ padding: '6px 4px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {item.building}
                </td>
                <td style={{ padding: '6px 4px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {item.floor}
                </td>
                <td style={{ padding: '6px 4px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {item.house_no}
                </td>
                <td style={{ padding: '6px 4px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {item.unit}
                </td>
                <td style={{ padding: '6px 4px', border: '1px solid #ddd', textAlign: 'right' }}>
                  {item.area}
                </td>
                <td style={{ padding: '6px 4px', border: '1px solid #ddd', textAlign: 'right' }}>
                  {formatCurrency(item.unit_price)}
                </td>
                <td style={{ padding: '6px 4px', border: '1px solid #ddd', textAlign: 'right' }}>
                  {formatCurrency(item.total_with_parking)}
                </td>
                <td style={{ 
                  padding: '6px 4px', 
                  border: '1px solid #ddd', 
                  textAlign: 'center',
                  color: item.sales_status === 'sold' ? '#52c41a' : 
                         item.sales_status === 'reserved' ? '#fa8c16' : 
                         item.sales_status === 'available' ? '#1890ff' : '#f5222d'
                }}>
                  {getStatusText(item.sales_status)}
                </td>
                <td style={{ padding: '6px 4px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {item.sales_person_name || '-'}
                </td>
                <td style={{ padding: '6px 4px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {item.buyer || '-'}
                </td>
                <td style={{ padding: '6px 4px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {item.sign_date || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 頁腳 */}
      <div style={{
        marginTop: '30px',
        paddingTop: '15px',
        borderTop: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '10px',
        color: '#666'
      }}>
        <div>
          © {new Date().getFullYear()} {companyName} - 銷控管理系統
        </div>
        {showPageNumber && (
          <div>
            第 1 頁，共 1 頁
          </div>
        )}
      </div>
    </div>
  )
})

PDFTemplate.displayName = 'PDFTemplate'

export default PDFTemplate