"use client"

import React, { useState } from 'react'
import { Button, Upload, message, Modal, Space, Dropdown } from 'antd'
import { UploadOutlined, DownloadOutlined, FileExcelOutlined, FilePdfOutlined, DownOutlined } from '@ant-design/icons'
import type { UploadProps, MenuProps } from 'antd'
import * as XLSX from 'xlsx'
import PDFPreviewModal from './PDFPreviewModal'
import PDFTemplateConfig, { PDFConfig, defaultConfig } from './PDFTemplateConfig'
import { SalesControlData } from './SalesControlTable'

interface ImportExportActionsProps {
  data: SalesControlData[]
  projectId: number
  onImportSuccess: () => void
}

const ImportExportActions: React.FC<ImportExportActionsProps> = ({
  data,
  projectId,
  onImportSuccess
}) => {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showPDFConfig, setShowPDFConfig] = useState(false)
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  const [pdfConfig, setPdfConfig] = useState<PDFConfig>(defaultConfig)

  // Excel導入處理
  const handleImport: UploadProps['customRequest'] = async (options) => {
    const { file } = options
    setImporting(true)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          // 轉換數據格式
          const salesControlData = jsonData.map((row: any) => ({
            building: row['棟別'] || '',
            floor: parseInt(row['樓層']) || 0,
            unit: row['戶型'] || '',
            house_no: row['戶號'] || '',
            area: row['面積'] || '',
            unit_price: row['單價'] || '',
            house_total: row['房屋總價'] || '',
            total_with_parking: row['總價'] || '',
            base_price: row['底價'] || '',
            premium_rate: row['溢價率'] || '',
            sales_status: row['銷售狀態'] || 'available',
            sales_date: row['銷售日期'] || '',
            deposit_date: row['下訂日期'] || '',
            sign_date: row['簽約日期'] || '',
            buyer: row['客戶姓名'] || '',
            sales_id: row['銷售人員ID'] || '',
            parking_ids: row['停車位ID'] || '',
            custom_change: row['客變需求'] === '是' ? 1 : 0,
            custom_change_content: row['客變內容'] || null,
            media_source: row['媒體來源'] || null,
            introducer: row['介紹人'] || null,
            notes: row['備註'] || ''
          }))

          // 調用批量導入API
          const response = await fetch(`/api/projects/${projectId}/sales-control/batch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(salesControlData)
          })

          if (response.ok) {
            const result = await response.json()
            message.success(`成功導入 ${result.created} 條新記錄，更新 ${result.updated} 條記錄`)
            onImportSuccess()
          } else {
            const error = await response.json()
            message.error(`導入失敗：${error.message}`)
          }
        } catch (error) {
          console.error('Excel解析錯誤:', error)
          message.error('Excel文件格式錯誤，請檢查文件格式')
        } finally {
          setImporting(false)
        }
      }
      reader.readAsArrayBuffer(file as File)
    } catch (error) {
      console.error('文件讀取錯誤:', error)
      message.error('文件讀取失敗')
      setImporting(false)
    }
  }

  // Excel導出
  const exportToExcel = () => {
    setExporting(true)
    try {
      const exportData = data.map(item => ({
        '棟別': item.building,
        '樓層': item.floor,
        '戶號': item.house_no,
        '戶型': item.unit,
        '面積': item.area,
        '單價': item.unit_price,
        '房屋總價': item.house_total,
        '總價': item.total_with_parking,
        '銷售狀態': item.sales_status === 'available' ? '可售' : 
                   item.sales_status === 'reserved' ? '預約' :
                   item.sales_status === 'sold' ? '已售' : '退戶',
        '銷售人員': item.sales_person_name || '',
        '客戶姓名': item.buyer || '',
        '下訂日期': item.deposit_date || '',
        '簽約日期': item.sign_date || '',
        '客變需求': item.custom_change ? '是' : '否',
        '客變內容': item.custom_change_content || '',
        '底價': item.base_price || '',
        '溢價率': item.premium_rate || '',
        '媒體來源': item.media_source || '',
        '介紹人': item.introducer || '',
        '備註': item.notes || ''
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '銷控數據')
      
      const fileName = `銷控數據_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)
      
      message.success('Excel導出成功')
    } catch (error) {
      console.error('Excel導出錯誤:', error)
      message.error('Excel導出失敗')
    } finally {
      setExporting(false)
    }
  }

  // 下載模板
  const downloadTemplate = () => {
    const templateData = [{
      '棟別': 'A',
      '樓層': 1,
      '戶號': 'A101',
      '戶型': '3房2廳2衛',
      '面積': '100',
      '單價': '500000',
      '房屋總價': '50000000',
      '總價': '52000000',
      '銷售狀態': 'available',
      '銷售人員ID': '',
      '客戶姓名': '',
      '下訂日期': '',
      '簽約日期': '',
      '客變需求': '否',
      '客變內容': '',
      '底價': '48000000',
      '溢價率': '4.17%',
      '媒體來源': '',
      '介紹人': '',
      '停車位ID': '',
      '備註': ''
    }]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '銷控數據模板')
    
    XLSX.writeFile(workbook, '銷控數據導入模板.xlsx')
    message.success('模板下載成功')
  }

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      label: 'Excel格式',
      icon: <FileExcelOutlined />,
      onClick: exportToExcel
    },
    {
      key: 'pdf',
      label: 'PDF格式',
      icon: <FilePdfOutlined />,
      onClick: () => setShowPDFConfig(true)
    }
  ]

  return (
    <Space>
      <Upload
        accept=".xlsx,.xls"
        showUploadList={false}
        customRequest={handleImport}
        disabled={importing}
      >
        <Button 
          icon={<UploadOutlined />} 
          loading={importing}
        >
          導入Excel
        </Button>
      </Upload>
      
      <Dropdown menu={{ items: exportMenuItems }} disabled={exporting}>
        <Button 
          icon={<DownloadOutlined />} 
          loading={exporting}
        >
          導出數據 <DownOutlined />
        </Button>
      </Dropdown>
      
      <Button 
        type="dashed" 
        onClick={downloadTemplate}
      >
        下載模板
      </Button>
      
      {/* PDF配置模态框 */}
      <PDFTemplateConfig
        visible={showPDFConfig}
        onCancel={() => setShowPDFConfig(false)}
        onConfirm={(config) => {
          setPdfConfig(config)
          setShowPDFConfig(false)
          setShowPDFPreview(true) // 显示预览
        }}
        initialConfig={pdfConfig}
      />
      
      {/* PDF预览模态框 */}
      <PDFPreviewModal
        visible={showPDFPreview}
        onCancel={() => setShowPDFPreview(false)}
        data={data}
        config={pdfConfig}
      />
    </Space>
  )
}

export default ImportExportActions