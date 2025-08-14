"use client"

import React, { useState, useRef } from 'react'
import { Modal, Button, Space, message, Spin, Tabs } from 'antd'
import { DownloadOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { SalesControlData } from './SalesControlTable'
import { PDFConfig } from './PDFTemplateConfig'
import PDFTemplate from './PDFTemplate'

interface PDFPreviewModalProps {
  visible: boolean
  onCancel: () => void
  data: SalesControlData[]
  config: PDFConfig
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  visible,
  onCancel,
  data,
  config
}) => {
  const [exporting, setExporting] = useState(false)
  const [activeTab, setActiveTab] = useState('preview')
  const templateRef = useRef<any>(null)

  // 导出PDF
  const handleExportPDF = async () => {
    if (!templateRef.current) {
      message.error('無法獲取預覽內容')
      return
    }

    setExporting(true)
    try {
      const element = templateRef.current.getElement()
      if (!element) {
        throw new Error('無法獲取PDF模板元素')
      }

      console.log('開始生成PDF，元素尺寸:', {
        width: element.scrollWidth,
        height: element.scrollHeight
      })

      // 等待一下确保内容完全渲染
      await new Promise(resolve => setTimeout(resolve, 500))

      // 使用html2canvas转换为图片
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        foreignObjectRendering: false,
        logging: false,
        removeContainer: false,
        imageTimeout: 30000,
        onclone: (clonedDoc, element) => {
          // 确保样式正确
          const style = clonedDoc.createElement('style')
          style.textContent = `
            * {
              font-family: "Microsoft JhengHei", "PingFang TC", "Helvetica Neue", Arial, sans-serif !important;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: white;
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
          
          if (element) {
            element.style.display = 'block'
            element.style.visibility = 'visible'
            element.style.opacity = '1'
            element.style.position = 'static'
            element.style.transform = 'none'
          }
        }
      })

      // 创建PDF
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

      // 保存PDF
      const fileName = `銷控管理報表_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
      message.success('PDF導出成功')
    } catch (error) {
      console.error('PDF導出錯誤:', error)
      message.error(`PDF導出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setExporting(false)
    }
  }

  // 打印功能
  const handlePrint = () => {
    if (!templateRef.current) {
      message.error('無法獲取預覽內容')
      return
    }

    const element = templateRef.current.getElement()
    if (element) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>銷控管理報表</title>
              <style>
                * {
                  font-family: "Microsoft JhengHei", "PingFang TC", "Helvetica Neue", Arial, sans-serif;
                  box-sizing: border-box;
                }
                body {
                  margin: 0;
                  padding: 20px;
                  background-color: white;
                }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              ${element.outerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    }
  }

  return (
    <Modal
      title="PDF預覽與導出"
      open={visible}
      onCancel={onCancel}
      width="90%"
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button 
          key="print" 
          icon={<PrinterOutlined />} 
          onClick={handlePrint}
        >
          打印
        </Button>,
        <Button 
          key="export" 
          type="primary" 
          icon={<DownloadOutlined />} 
          loading={exporting}
          onClick={handleExportPDF}
        >
          導出PDF
        </Button>
      ]}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'preview',
            label: (
              <span>
                <EyeOutlined />
                預覽
              </span>
            ),
            children: (
              <div style={{ 
                maxHeight: '70vh', 
                overflow: 'auto',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                padding: '20px',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ 
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <PDFTemplate
                    ref={templateRef}
                    data={data}
                    config={config}
                  />
                </div>
              </div>
            )
          },
          {
            key: 'config',
            label: '配置',
            children: (
              <div style={{ padding: '20px' }}>
                <h3>當前配置</h3>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '15px', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>
            )
          }
        ]}
      />
    </Modal>
  )
}

export default PDFPreviewModal
