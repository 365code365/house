"use client"

import React from 'react'
import {SalesControlData} from './SalesControlTable'
import {PDFConfig} from './PDFTemplateConfig'

interface PDFTemplateProps {
    data: SalesControlData[]
    config?: Partial<PDFConfig>
}

interface PDFTemplateRef {
    getElement: () => HTMLDivElement | null
}

const PDFTemplate = React.forwardRef<PDFTemplateRef, PDFTemplateProps>((
    {data, config = {}}, ref
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
            case 'available':
                return '可售'
            case 'reserved':
                return '預約'
            case 'sold':
                return '已售'
            case 'withdrawn':
                return '退戶'
            default:
                return status
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sold':
                return '#52c41a'
            case 'reserved':
                return '#fa8c16'
            case 'available':
                return '#1890ff'
            case 'withdrawn':
                return '#f5222d'
            default:
                return '#666'
        }
    }

    const formatCurrency = (value: string | number) => {
        if (!value) return '-'
        const num = typeof value === 'string' ? parseFloat(value) : value
        if (isNaN(num)) return '-'
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0
        }).format(num)
    }

    // 确保数据存在且为数组
    const safeData = Array.isArray(data) ? data : []
    const totalUnits = safeData.length
    const soldUnits = safeData.filter(item => item.sales_status === 'sold').length
    const reservedUnits = safeData.filter(item => item.sales_status === 'reserved').length
    const availableUnits = safeData.filter(item => item.sales_status === 'available').length
    const withdrawnUnits = safeData.filter(item => item.sales_status === 'withdrawn').length

    // 计算总价值
    const totalValue = safeData.reduce((sum, item) => {
        const value = parseFloat(item.total_with_parking) || 0
        return sum + value
    }, 0)

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
                alignItems: 'flex-start',
                marginBottom: '30px',
                paddingBottom: '20px',
                borderBottom: `3px solid ${headerColor}`,
                position: 'relative'
            }}>
                <div style={{flex: 1}}>
                    {showLogo && logoUrl && (
                        <img
                            src={logoUrl}
                            alt="Logo"
                            style={{
                                height: '60px',
                                marginBottom: '15px',
                                display: 'block'
                            }}
                        />
                    )}
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
                        <div style={{fontSize: '28px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px'}}>
                            {totalUnits}
                        </div>
                        <div style={{fontSize: '13px', color: '#666', fontWeight: '500'}}>
                            總戶數
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
                        <div style={{fontSize: '28px', fontWeight: 'bold', color: '#52c41a', marginBottom: '8px'}}>
                            {soldUnits}
                        </div>
                        <div style={{fontSize: '13px', color: '#666', fontWeight: '500'}}>
                            已售戶數
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
                        <div style={{fontSize: '28px', fontWeight: 'bold', color: '#fa8c16', marginBottom: '8px'}}>
                            {reservedUnits}
                        </div>
                        <div style={{fontSize: '13px', color: '#666', fontWeight: '500'}}>
                            預約戶數
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
                        <div style={{fontSize: '28px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px'}}>
                            {availableUnits}
                        </div>
                        <div style={{fontSize: '13px', color: '#666', fontWeight: '500'}}>
                            可售戶數
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
                        <div style={{fontSize: '28px', fontWeight: 'bold', color: '#f5222d', marginBottom: '8px'}}>
                            {withdrawnUnits}
                        </div>
                        <div style={{fontSize: '13px', color: '#666', fontWeight: '500'}}>
                            退戶數
                        </div>
                    </div>
                </div>
            )}

            {/* 总价值统计 */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '30px',
                border: '1px solid #e9ecef'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#333'
                    }}>
                        項目總價值
                    </h3>
                    <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#1890ff'
                    }}>
                        {formatCurrency(totalValue)}
                    </div>
                </div>
            </div>

            {/* 數據表格 */}
            <div style={{
                marginBottom: '30px'
            }}>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    color: '#333',
                    borderBottom: '2px solid #e9ecef',
                    paddingBottom: '10px'
                }}>
                    詳細數據列表
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
                            fontSize: '11px',
                            backgroundColor: 'white'
                        }}>
                            <thead>
                            <tr style={{
                                backgroundColor: headerColor,
                                color: 'white'
                            }}>
                                <th style={{
                                    padding: '12px 8px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>棟別
                                </th>
                                <th style={{
                                    padding: '12px 8px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>樓層
                                </th>
                                <th style={{
                                    padding: '12px 8px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>戶號
                                </th>
                                <th style={{
                                    padding: '12px 8px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>戶型
                                </th>
                                <th style={{
                                    padding: '12px 8px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>面積
                                </th>
                                <th style={{
                                    padding: '12px 8px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>單價
                                </th>
                                <th style={{
                                    padding: '12px 8px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>總價
                                </th>
                                <th style={{
                                    padding: '12px 8px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>狀態
                                </th>
                                <th style={{
                                    padding: '12px 8px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>銷售人員
                                </th>
                                <th style={{
                                    padding: '12px 8px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>客戶
                                </th>
                                <th style={{
                                    padding: '12px 8px',
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>簽約日期
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {safeData.map((item, index) => (
                                <tr key={index} style={{
                                    backgroundColor: tableStyle === 'striped' ?
                                        (index % 2 === 0 ? '#f8f9fa' : 'white') : 'white',
                                    border: tableStyle === 'bordered' ? '1px solid #dee2e6' : 'none'
                                }}>
                                    <td style={{
                                        padding: '10px 8px',
                                        border: '1px solid #dee2e6',
                                        textAlign: 'center',
                                        fontWeight: '500'
                                    }}>
                                        {item.building || '-'}
                                    </td>
                                    <td style={{padding: '10px 8px', border: '1px solid #dee2e6', textAlign: 'center'}}>
                                        {item.floor || '-'}
                                    </td>
                                    <td style={{
                                        padding: '10px 8px',
                                        border: '1px solid #dee2e6',
                                        textAlign: 'center',
                                        fontWeight: '500'
                                    }}>
                                        {item.house_no || '-'}
                                    </td>
                                    <td style={{padding: '10px 8px', border: '1px solid #dee2e6', textAlign: 'center'}}>
                                        {item.unit || '-'}
                                    </td>
                                    <td style={{padding: '10px 8px', border: '1px solid #dee2e6', textAlign: 'right'}}>
                                        {item.area || '-'}
                                    </td>
                                    <td style={{
                                        padding: '10px 8px',
                                        border: '1px solid #dee2e6',
                                        textAlign: 'right',
                                        fontFamily: 'monospace'
                                    }}>
                                        {formatCurrency(item.unit_price)}
                                    </td>
                                    <td style={{
                                        padding: '10px 8px',
                                        border: '1px solid #dee2e6',
                                        textAlign: 'right',
                                        fontFamily: 'monospace',
                                        fontWeight: '500'
                                    }}>
                                        {formatCurrency(item.total_with_parking)}
                                    </td>
                                    <td style={{
                                        padding: '10px 8px',
                                        border: '1px solid #dee2e6',
                                        textAlign: 'center',
                                        color: getStatusColor(item.sales_status),
                                        fontWeight: 'bold'
                                    }}>
                                        {getStatusText(item.sales_status)}
                                    </td>
                                    <td style={{padding: '10px 8px', border: '1px solid #dee2e6', textAlign: 'center'}}>
                                        {item.sales_person_name || '-'}
                                    </td>
                                    <td style={{padding: '10px 8px', border: '1px solid #dee2e6', textAlign: 'center'}}>
                                        {item.buyer || '-'}
                                    </td>
                                    <td style={{padding: '10px 8px', border: '1px solid #dee2e6', textAlign: 'center'}}>
                                        {item.sign_date || '-'}
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
                        <div style={{fontSize: '48px', marginBottom: '20px'}}>📊</div>
                        暫無數據
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
                <div style={{fontWeight: '500'}}>
                    © {new Date().getFullYear()} {companyName} - 銷控管理系統
                </div>
                {showPageNumber && (
                    <div style={{fontWeight: '500'}}>
                        第 1 頁，共 1 頁
                    </div>
                )}
            </div>
        </div>
    )
})

PDFTemplate.displayName = 'PDFTemplate'

export default PDFTemplate