"use client"

import React, { useState } from 'react'
import { Button, message, Dropdown } from 'antd'
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, DownOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import * as XLSX from 'xlsx'
import { PurchasedCustomerItem } from '@/app/project/[id]/purchased-customers/page'

interface ImportExportActionsProps {
  data: PurchasedCustomerItem[]
  projectId: string
}

const ImportExportActions: React.FC<ImportExportActionsProps> = ({
  data,
  projectId
}) => {
  const [exporting, setExporting] = useState(false)

  // Excel導出
  const exportToExcel = () => {
    setExporting(true)
    try {
      const exportData = data.map(item => ({
        '客戶姓名': item.customerName,
        '聯絡電話': item.contactPhone,
        '電子郵件': item.email || '',
        '合約編號': item.contractNumber,
        '房號': item.houseNo,
        '房型': item.houseType,
        '購買日期': new Date(item.purchaseDate).toLocaleDateString('zh-TW'),
        '總金額': item.totalAmount,
        '已付金額': item.paidAmount,
        '剩餘金額': item.remainingAmount,
        '付款狀態': item.paymentStatus === 'COMPLETED' ? '已完成' :
                   item.paymentStatus === 'PARTIAL' ? '部分付款' : '待付款',
        '貸款狀態': item.loanStatus === 'APPROVED' ? '已核准' :
                   item.loanStatus === 'APPLIED' ? '已申請' :
                   item.loanStatus === 'REJECTED' ? '已拒絕' : '未申請',
        '合約狀態': item.contractStatus === 'SIGNED' ? '已簽約' :
                   item.contractStatus === 'PENDING' ? '待簽約' : '已取消',
        '交房狀態': item.handoverStatus === 'COMPLETED' ? '已交房' :
                   item.handoverStatus === 'SCHEDULED' ? '已排程' : '未交房',
        '交房日期': item.handoverDate ? new Date(item.handoverDate).toLocaleDateString('zh-TW') : '',
        '銷售人員ID': item.salesPersonId || '',
        '客戶評級': item.rating,
        '郵寄地址': item.mailingAddress || '',
        '最後聯絡日期': item.lastContactDate ? new Date(item.lastContactDate).toLocaleDateString('zh-TW') : '',
        '下次跟進日期': item.nextFollowUpDate ? new Date(item.nextFollowUpDate).toLocaleDateString('zh-TW') : '',
        '備註': item.remark || '',
        '創建時間': new Date(item.createdAt).toLocaleDateString('zh-TW'),
        '更新時間': new Date(item.updatedAt).toLocaleDateString('zh-TW')
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '已購客戶數據')
      
      // 設置列寬
      const colWidths = [
        { wch: 12 }, // 客戶姓名
        { wch: 15 }, // 聯絡電話
        { wch: 20 }, // 電子郵件
        { wch: 15 }, // 合約編號
        { wch: 10 }, // 房號
        { wch: 15 }, // 房型
        { wch: 12 }, // 購買日期
        { wch: 12 }, // 總金額
        { wch: 12 }, // 已付金額
        { wch: 12 }, // 剩餘金額
        { wch: 10 }, // 付款狀態
        { wch: 10 }, // 貸款狀態
        { wch: 10 }, // 合約狀態
        { wch: 10 }, // 交房狀態
        { wch: 12 }, // 交房日期
        { wch: 12 }, // 銷售人員ID
        { wch: 8 },  // 客戶評級
        { wch: 25 }, // 郵寄地址
        { wch: 12 }, // 最後聯絡日期
        { wch: 12 }, // 下次跟進日期
        { wch: 20 }, // 備註
        { wch: 12 }, // 創建時間
        { wch: 12 }  // 更新時間
      ]
      worksheet['!cols'] = colWidths
      
      const fileName = `已購客戶數據_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '')}.xlsx`
      XLSX.writeFile(workbook, fileName)
      message.success('Excel 導出成功')
    } catch (error) {
      console.error('Excel 導出失敗:', error)
      message.error('Excel 導出失敗')
    } finally {
      setExporting(false)
    }
  }

  // CSV導出
  const exportToCSV = () => {
    setExporting(true)
    try {
      const exportData = data.map(item => ({
        '客戶姓名': item.customerName,
        '聯絡電話': item.contactPhone,
        '電子郵件': item.email || '',
        '合約編號': item.contractNumber,
        '房號': item.houseNo,
        '房型': item.houseType,
        '購買日期': new Date(item.purchaseDate).toLocaleDateString('zh-TW'),
        '總金額': item.totalAmount,
        '已付金額': item.paidAmount,
        '剩餘金額': item.remainingAmount,
        '付款狀態': item.paymentStatus === 'COMPLETED' ? '已完成' :
                   item.paymentStatus === 'PARTIAL' ? '部分付款' : '待付款',
        '貸款狀態': item.loanStatus === 'APPROVED' ? '已核准' :
                   item.loanStatus === 'APPLIED' ? '已申請' :
                   item.loanStatus === 'REJECTED' ? '已拒絕' : '未申請',
        '合約狀態': item.contractStatus === 'SIGNED' ? '已簽約' :
                   item.contractStatus === 'PENDING' ? '待簽約' : '已取消',
        '交房狀態': item.handoverStatus === 'COMPLETED' ? '已交房' :
                   item.handoverStatus === 'SCHEDULED' ? '已排程' : '未交房',
        '交房日期': item.handoverDate ? new Date(item.handoverDate).toLocaleDateString('zh-TW') : '',
        '銷售人員ID': item.salesPersonId || '',
        '客戶評級': item.rating,
        '郵寄地址': item.mailingAddress || '',
        '最後聯絡日期': item.lastContactDate ? new Date(item.lastContactDate).toLocaleDateString('zh-TW') : '',
        '下次跟進日期': item.nextFollowUpDate ? new Date(item.nextFollowUpDate).toLocaleDateString('zh-TW') : '',
        '備註': item.remark || '',
        '創建時間': new Date(item.createdAt).toLocaleDateString('zh-TW'),
        '更新時間': new Date(item.updatedAt).toLocaleDateString('zh-TW')
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const csvContent = XLSX.utils.sheet_to_csv(worksheet)
      
      // 添加 BOM 以支持中文字符
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `已購客戶數據_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      message.success('CSV 導出成功')
    } catch (error) {
      console.error('CSV 導出失敗:', error)
      message.error('CSV 導出失敗')
    } finally {
      setExporting(false)
    }
  }

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'csv',
      label: 'CSV格式',
      icon: <FileExcelOutlined />,
      onClick: exportToCSV
    },
    {
      key: 'excel',
      label: 'Excel格式',
      icon: <FileExcelOutlined />,
      onClick: exportToExcel
    }
  ]

  return (
    <Dropdown
      menu={{ items: exportMenuItems }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button 
        icon={<DownloadOutlined />} 
        loading={exporting}
      >
        匯出數據 <DownOutlined />
      </Button>
    </Dropdown>
  )
}

export default ImportExportActions