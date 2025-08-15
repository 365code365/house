import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { WithdrawalRecord } from '@/types/withdrawal'
import dayjs from 'dayjs'

// PDF導出配置
export interface PDFExportConfig {
  title?: string
  subtitle?: string
  filename?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'a3' | 'letter'
  margin?: number
}

// 默認配置
const defaultConfig: PDFExportConfig = {
  title: '退戶記錄報表',
  subtitle: `生成時間：${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
  filename: `withdrawal-records-${dayjs().format('YYYY-MM-DD')}.pdf`,
  orientation: 'landscape',
  format: 'a4',
  margin: 20
}

// 退戶記錄PDF導出
export const exportWithdrawalRecordsToPDF = async (
  records: WithdrawalRecord[],
  config: Partial<PDFExportConfig> = {}
): Promise<void> => {
  const finalConfig = { ...defaultConfig, ...config }
  
  try {
    // 創建PDF文檔
    const pdf = new jsPDF({
      orientation: finalConfig.orientation,
      unit: 'mm',
      format: finalConfig.format
    })

    // 設置字體（支持中文）
    pdf.setFont('helvetica')
    
    // 頁面尺寸
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = finalConfig.margin || 20
    const contentWidth = pageWidth - 2 * margin
    
    let currentY = margin
    
    // 添加標題
    if (finalConfig.title) {
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      const titleWidth = pdf.getTextWidth(finalConfig.title)
      pdf.text(finalConfig.title, (pageWidth - titleWidth) / 2, currentY)
      currentY += 15
    }
    
    // 添加副標題
    if (finalConfig.subtitle) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const subtitleWidth = pdf.getTextWidth(finalConfig.subtitle)
      pdf.text(finalConfig.subtitle, (pageWidth - subtitleWidth) / 2, currentY)
      currentY += 20
    }
    
    // 表格標題
    const headers = [
      '客戶姓名',
      '房號',
      '房型',
      '原價',
      '已付金額',
      '退款金額',
      '退戶原因',
      '退戶日期',
      '狀態'
    ]
    
    // 計算列寬
    const colWidths = [
      contentWidth * 0.12, // 客戶姓名
      contentWidth * 0.12, // 房號
      contentWidth * 0.08, // 房型
      contentWidth * 0.12, // 原價
      contentWidth * 0.12, // 已付金額
      contentWidth * 0.12, // 退款金額
      contentWidth * 0.15, // 退戶原因
      contentWidth * 0.10, // 退戶日期
      contentWidth * 0.07  // 狀態
    ]
    
    // 繪製表格標題
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    
    let currentX = margin
    const rowHeight = 8
    
    // 標題行背景
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, currentY, contentWidth, rowHeight, 'F')
    
    // 標題文字
    headers.forEach((header, index) => {
      pdf.text(header, currentX + 2, currentY + 5)
      currentX += colWidths[index]
    })
    
    currentY += rowHeight
    
    // 繪製數據行
    pdf.setFont('helvetica', 'normal')
    
    records.forEach((record, rowIndex) => {
      // 檢查是否需要新頁面
      if (currentY + rowHeight > pageHeight - margin) {
        pdf.addPage()
        currentY = margin
      }
      
      currentX = margin
      
      // 交替行背景色
      if (rowIndex % 2 === 1) {
        pdf.setFillColor(250, 250, 250)
        pdf.rect(margin, currentY, contentWidth, rowHeight, 'F')
      }
      
      // 數據內容
      const rowData = [
        record.customerName || '',
        `${record.building}-${record.floor}-${record.unit}`,
        record.houseNo || '',
        record.housePrice ? `¥${record.housePrice.toLocaleString()}` : '',
        record.totalPrice ? `¥${record.totalPrice.toLocaleString()}` : '',
        '', // 退款金額欄位（schema中無此字段）
        record.reason || '',
        record.withdrawalDate ? dayjs(record.withdrawalDate).format('YYYY-MM-DD') : '',
        getStatusText(record.status)
      ]
      
      rowData.forEach((data, colIndex) => {
        // 文字截斷處理
        const maxWidth = colWidths[colIndex] - 4
        let text = data
        
        if (pdf.getTextWidth(text) > maxWidth) {
          while (pdf.getTextWidth(text + '...') > maxWidth && text.length > 0) {
            text = text.slice(0, -1)
          }
          text += '...'
        }
        
        pdf.text(text, currentX + 2, currentY + 5)
        currentX += colWidths[colIndex]
      })
      
      currentY += rowHeight
    })
    
    // 添加表格邊框
    drawTableBorders(pdf, margin, margin + 35, contentWidth, records.length * rowHeight + rowHeight, colWidths)
    
    // 添加統計信息
    currentY += 10
    if (currentY + 30 > pageHeight - margin) {
      pdf.addPage()
      currentY = margin
    }
    
    pdf.setFont('helvetica', 'bold')
    pdf.text('統計信息：', margin, currentY)
    currentY += 8
    
    pdf.setFont('helvetica', 'normal')
    const totalRecords = records.length
    const totalRefund = records.reduce((sum, record) => sum + (Number(record.totalPrice) || 0), 0)
    
    pdf.text(`總記錄數：${totalRecords}`, margin, currentY)
    currentY += 6
    pdf.text(`總退款金額：¥${totalRefund.toLocaleString()}`, margin, currentY)
    
    // 保存PDF
    pdf.save(finalConfig.filename!)
    
  } catch (error) {
    console.error('PDF導出失敗:', error)
    throw new Error('PDF導出失敗')
  }
}

// 繪製表格邊框
const drawTableBorders = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  colWidths: number[]
) => {
  // 外邊框
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.1)
  pdf.rect(x, y, width, height)
  
  // 垂直線
  let currentX = x
  colWidths.forEach((colWidth, index) => {
    if (index < colWidths.length - 1) {
      currentX += colWidth
      pdf.line(currentX, y, currentX, y + height)
    }
  })
  
  // 水平線（標題行分隔線）
  pdf.line(x, y + 8, x + width, y + 8)
}

// 獲取狀態文字
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'APPLIED': '已申請',
    'PROCESSING': '處理中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
  }
  return statusMap[status] || status
}

// 導出單個退戶記錄詳情PDF
export const exportWithdrawalRecordDetailToPDF = async (
  record: WithdrawalRecord,
  config: Partial<PDFExportConfig> = {}
): Promise<void> => {
  const finalConfig = {
    ...defaultConfig,
    title: '退戶記錄詳情',
    filename: `withdrawal-record-${record.id}-${dayjs().format('YYYY-MM-DD')}.pdf`,
    orientation: 'portrait' as const,
    ...config
  }
  
  try {
    const pdf = new jsPDF({
      orientation: finalConfig.orientation,
      unit: 'mm',
      format: finalConfig.format
    })
    
    pdf.setFont('helvetica')
    
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = finalConfig.margin || 20
    let currentY = margin
    
    // 標題
    if (finalConfig.title) {
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      const titleWidth = pdf.getTextWidth(finalConfig.title)
      pdf.text(finalConfig.title, (pageWidth - titleWidth) / 2, currentY)
      currentY += 20
    }
    
    // 詳情內容
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    
    const details = [
      ['客戶姓名', record.customerName || ''],
      ['房號', `${record.building}-${record.floor}-${record.unit}`],
      ['房屋編號', record.houseNo || ''],
      ['房屋價格', record.housePrice ? `¥${Number(record.housePrice).toLocaleString()}` : ''],
      ['總價', record.totalPrice ? `¥${Number(record.totalPrice).toLocaleString()}` : ''],
      ['停車位價格', record.parkingPrice ? `¥${Number(record.parkingPrice).toLocaleString()}` : ''],
      ['退戶原因', record.reason || ''],
      ['退戶日期', record.withdrawalDate ? dayjs(record.withdrawalDate).format('YYYY-MM-DD') : ''],
      ['狀態', getStatusText(record.status)],
      ['創建時間', dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')],
      ['更新時間', dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm:ss')]
    ]
    
    details.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${label}：`, margin, currentY)
      
      pdf.setFont('helvetica', 'normal')
      const labelWidth = pdf.getTextWidth(`${label}：`)
      pdf.text(value, margin + labelWidth + 5, currentY)
      
      currentY += 10
    })
    
    pdf.save(finalConfig.filename!)
    
  } catch (error) {
    console.error('PDF導出失敗:', error)
    throw new Error('PDF導出失敗')
  }
}

// 從HTML元素導出PDF
export const exportElementToPDF = async (
  element: HTMLElement,
  config: Partial<PDFExportConfig> = {}
): Promise<void> => {
  const finalConfig = { ...defaultConfig, ...config }
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    })
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: finalConfig.orientation,
      unit: 'mm',
      format: finalConfig.format
    })
    
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = finalConfig.margin || 20
    
    const imgWidth = pageWidth - 2 * margin
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    let currentY = margin
    
    // 如果圖片高度超過頁面，需要分頁
    if (imgHeight > pageHeight - 2 * margin) {
      const pageContentHeight = pageHeight - 2 * margin
      const totalPages = Math.ceil(imgHeight / pageContentHeight)
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage()
        }
        
        const sourceY = i * pageContentHeight * (canvas.height / imgHeight)
        const sourceHeight = Math.min(
          pageContentHeight * (canvas.height / imgHeight),
          canvas.height - sourceY
        )
        
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = sourceHeight
        
        const pageCtx = pageCanvas.getContext('2d')!
        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        )
        
        const pageImgData = pageCanvas.toDataURL('image/png')
        const pageImgHeight = (sourceHeight * imgWidth) / canvas.width
        
        pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight)
      }
    } else {
      pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight)
    }
    
    pdf.save(finalConfig.filename!)
    
  } catch (error) {
    console.error('PDF導出失敗:', error)
    throw new Error('PDF導出失敗')
  }
}