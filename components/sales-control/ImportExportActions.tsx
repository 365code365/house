"use client"

import React, { useState } from 'react'
import { Button, Upload, message, Modal, Space, Dropdown } from 'antd'
import { UploadOutlined, DownloadOutlined, FileExcelOutlined, FilePdfOutlined, DownOutlined } from '@ant-design/icons'
import type { UploadProps, MenuProps } from 'antd'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import PDFTemplate, { PDFTemplateRef } from './PDFTemplate'
import PDFTemplateConfig, { PDFConfig, defaultConfig } from './PDFTemplateConfig'
import { SalesControlData } from './SalesControlTable'

// 擴展jsPDF類型以支持autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
  }
}

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

  // PDF導出
  const exportToPDF = async (config: PDFConfig = pdfConfig) => {
    setExporting(true)
    try {
      console.log('開始PDF導出，數據條數:', data.length)
      
      // Create a temporary container for the PDF template
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '-9999px'
      tempContainer.style.width = '1200px'
      tempContainer.style.height = 'auto'
      tempContainer.style.minHeight = '800px'
      tempContainer.style.backgroundColor = '#ffffff'
      tempContainer.style.padding = '20px'
      tempContainer.style.boxSizing = 'border-box'
      tempContainer.style.overflow = 'visible'
      tempContainer.style.display = 'block'
      tempContainer.style.visibility = 'visible'
      tempContainer.style.opacity = '1'
      tempContainer.style.zIndex = '9999'
      tempContainer.style.fontFamily = '"Microsoft JhengHei", "PingFang TC", "Helvetica Neue", Arial, sans-serif'
      tempContainer.style.fontSize = '14px'
      tempContainer.style.lineHeight = '1.5'
      tempContainer.style.color = '#000000'
      
      // 添加全局樣式到容器
      const globalStyle = document.createElement('style')
      globalStyle.textContent = `
        .pdf-temp-container * {
          box-sizing: border-box;
          font-family: "Microsoft JhengHei", "PingFang TC", "Helvetica Neue", Arial, sans-serif;
        }
        .pdf-temp-container table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
        }
        .pdf-temp-container th,
        .pdf-temp-container td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        .pdf-temp-container th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .pdf-temp-container .pdf-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .pdf-temp-container .pdf-stats {
          display: flex;
          justify-content: space-around;
          margin: 20px 0;
        }
      `
      tempContainer.className = 'pdf-temp-container'
      document.head.appendChild(globalStyle)
      document.body.appendChild(tempContainer)

      // Create PDF template component
      const { createRoot } = await import('react-dom/client')
      const root = createRoot(tempContainer)
      
      // Render the PDF template
      let templateRef: PDFTemplateRef | null = null
      let renderComplete = false
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!renderComplete) {
            reject(new Error('PDF模板渲染超時'))
          }
        }, 10000) // 10秒超時
        
        root.render(
          <PDFTemplate 
            ref={(ref) => {
              console.log('PDFTemplate ref回調:', ref ? '已設置' : '為空')
              templateRef = ref
              if (ref) {
                // 等待更長時間確保組件完全渲染
                setTimeout(() => {
                  const element = ref.getElement()
                  console.log('模板元素:', element ? '已獲取' : '為空')
                  if (element) {
                    renderComplete = true
                    clearTimeout(timeout)
                    resolve()
                  }
                }, 1000) // 增加到1秒等待時間
              }
            }}
            data={data}
            config={config}
          />
        )
      })

      const templateElement = templateRef?.getElement()
      if (!templateElement) {
        throw new Error('無法獲取PDF模板元素')
      }
      
      console.log('模板元素尺寸:', {
        width: templateElement.scrollWidth,
        height: templateElement.scrollHeight,
        offsetWidth: templateElement.offsetWidth,
        offsetHeight: templateElement.offsetHeight
      })

      // 等待一段時間確保所有樣式和內容完全加載
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('開始html2canvas轉換')
      
      // Convert HTML to canvas
      const canvas = await html2canvas(templateElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: templateElement.scrollWidth,
        height: templateElement.scrollHeight,
        foreignObjectRendering: true,
        logging: true, // 啟用調試日誌
        removeContainer: false,
        imageTimeout: 15000,
        onclone: (clonedDoc, element) => {
          console.log('html2canvas onclone回調')
          // 確保中文字體在克隆的文檔中正確加載
          const style = clonedDoc.createElement('style')
          style.textContent = `
            * {
              font-family: "Microsoft JhengHei", "PingFang TC", "Helvetica Neue", Arial, sans-serif !important;
              box-sizing: border-box;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
          `
          clonedDoc.head.appendChild(style)
          
          // 確保元素可見
          if (element) {
            element.style.display = 'block'
            element.style.visibility = 'visible'
            element.style.opacity = '1'
          }
        }
      })
      
      console.log('html2canvas轉換完成，canvas尺寸:', {
        width: canvas.width,
        height: canvas.height
      })

      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: config.pageOrientation || 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      
      // Clean up
      root.unmount()
      document.body.removeChild(tempContainer)
      
      // 清理添加的全局樣式
      const addedStyles = document.querySelectorAll('style')
      addedStyles.forEach(style => {
        if (style.textContent?.includes('.pdf-temp-container')) {
          document.head.removeChild(style)
        }
      })

      // Save the PDF
      pdf.save(`sales-control-${new Date().toISOString().split('T')[0]}.pdf`)
      
      message.success('PDF導出成功')
    } catch (error) {
      console.error('PDF導出錯誤:', error)
      message.error('PDF導出失敗')
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
      
      <PDFTemplateConfig
        visible={showPDFConfig}
        onCancel={() => setShowPDFConfig(false)}
        onConfirm={(config) => {
          setPdfConfig(config)
          setShowPDFConfig(false)
          exportToPDF(config)
        }}
        initialConfig={pdfConfig}
      />
    </Space>
  )
}

export default ImportExportActions