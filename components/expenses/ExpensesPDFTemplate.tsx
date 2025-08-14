"use client"

import React from 'react'

interface ExpenseItem {
  id: number
  expenseDate: string
  category: string
  item: string
  actualExpense: number
  quantity: number
  unit: string
  unitPrice: number
  vendor: string
  invoiceNo: string
  remark: string
}

interface ExpensesPDFTemplateProps {
  data: ExpenseItem[]
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

interface ExpensesPDFTemplateRef {
  getElement: () => HTMLDivElement | null
}

const ExpensesPDFTemplate = React.forwardRef<ExpensesPDFTemplateRef, ExpensesPDFTemplateProps>((
  { data, config = {} }, ref
) => {
  const elementRef = React.useRef<HTMLDivElement>(null)

  React.useImperativeHandle(ref, () => ({
    getElement: () => elementRef.current
  }))

  const {
    title = '費用管理報表',
    subtitle = '項目費用支出明細統計',
    companyName = '房地產費用管理系統',
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

  // 统计数据
  const safeData = Array.isArray(data) ? data : []
  const totalExpense = safeData.reduce((sum, item) => sum + item.actualExpense, 0)
  const totalQuantity = safeData.reduce((sum, item) => sum + item.quantity, 0)
  const categoryStats = safeData.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.actualExpense
    return acc
  }, {} as Record<string, number>)
  const topCategory = Object.entries(categoryStats).sort(([,a], [,b]) => b - a)[0]

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
          gridTemplateColumns: 'repeat(4, 1fr)',
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
              {formatCurrency(totalExpense)}
            </div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
              總費用
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
              {safeData.length}
            </div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
              費用項目
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
              {totalQuantity}
            </div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
              總數量
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
              {Object.keys(categoryStats).length}
            </div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
              費用類別
            </div>
          </div>
        </div>
      )}

      {/* 費用概況 */}
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
          費用概況
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '5px' }}>平均單價</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              {safeData.length > 0 ? formatCurrency(totalExpense / totalQuantity) : '-'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '5px' }}>最高費用類別</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
              {topCategory ? topCategory[0] : '-'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '5px' }}>最高類別金額</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
              {topCategory ? formatCurrency(topCategory[1]) : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 費用類別統計 */}
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
          費用類別統計
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {Object.entries(categoryStats).map(([category, amount], index) => (
            <div key={category} style={{
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{category}</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: headerColor }}>
                {formatCurrency(amount)}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {((amount / totalExpense) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 詳細費用列表 */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#333',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '10px'
        }}>
          詳細費用列表
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
              fontSize: '9px',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: headerColor,
                  color: 'white'
                }}>
                  <th style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>日期</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>類別</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>項目</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>金額</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>數量</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>單價</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>供應商</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>發票號</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>備註</th>
                </tr>
              </thead>
              <tbody>
                {safeData.map((item, index) => (
                  <tr key={index} style={{
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                  }}>
                    <td style={{ padding: '6px 4px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {item.expenseDate}
                    </td>
                    <td style={{ padding: '6px 4px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: '500' }}>
                      {item.category}
                    </td>
                    <td style={{ padding: '6px 4px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {item.item}
                    </td>
                    <td style={{ 
                      padding: '6px 4px', 
                      border: '1px solid #dee2e6', 
                      textAlign: 'right', 
                      fontFamily: 'monospace',
                      fontWeight: '500'
                    }}>
                      {formatCurrency(item.actualExpense)}
                    </td>
                    <td style={{ padding: '6px 4px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {item.quantity} {item.unit}
                    </td>
                    <td style={{ padding: '6px 4px', border: '1px solid #dee2e6', textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td style={{ padding: '6px 4px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {item.vendor}
                    </td>
                    <td style={{ padding: '6px 4px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {item.invoiceNo || '-'}
                    </td>
                    <td style={{ padding: '6px 4px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {item.remark || '-'}
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
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>💸</div>
            暫無費用數據
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
          © {new Date().getFullYear()} {companyName} - 費用管理系統
        </div>
        <div style={{ fontWeight: '500' }}>
          第 1 頁，共 1 頁
        </div>
      </div>
    </div>
  )
})

ExpensesPDFTemplate.displayName = 'ExpensesPDFTemplate'

export default ExpensesPDFTemplate
