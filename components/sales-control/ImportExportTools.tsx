import React, { useState } from 'react'
import { Button, Modal, Upload, Table, App, Space, Divider, Typography, Alert } from 'antd'
import { UploadOutlined, DownloadOutlined, FileExcelOutlined, FilePdfOutlined, EyeOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import { SalesControlData } from '@/types/sales-control'
import { formatCurrency } from '@/lib/utils'

const { Title, Text } = Typography

interface ImportExportToolsProps {
  data: SalesControlData[]
  onImport: (data: SalesControlData[]) => void
  projectId: number
}

interface PreviewData {
  [key: string]: any
}

const ImportExportTools: React.FC<ImportExportToolsProps> = ({ data, onImport, projectId }) => {
  const { message } = App.useApp()
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData[]>([])
  const [previewColumns, setPreviewColumns] = useState<any[]>([])
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])

  // Excel导出
  const handleExcelExport = () => {
    try {
      const exportData = data.map(item => ({
        '房屋编号': item.house_no,
        '楼栋': item.building,
        '楼层': item.floor,
        '房型': item.unit,
        '面积': item.area,
        '销售状态': item.sales_status,
        '单价': item.unit_price,
        '房屋总价': item.house_total,
        '车位数量': item.parking_spaces?.length || 0,
        '车位底价': item.base_price,
        '溢价率': item.premium_rate,
        '含车位总价': item.total_with_parking,
        '买方': item.buyer,
        '下订日期': item.deposit_date,
        '签约日期': item.sign_date,
        '销售人员': item.sales_person_name,
        '媒体来源': item.media_source,
        '介绍人': item.introducer,
        '客变内容': item.custom_change_content,
        '备注': item.notes
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '销控数据')
      
      // 设置列宽
      const colWidths = [
        { wch: 12 }, // 房屋编号
        { wch: 8 },  // 楼栋
        { wch: 6 },  // 楼层
        { wch: 10 }, // 房型
        { wch: 8 },  // 面积
        { wch: 10 }, // 销售状态
        { wch: 12 }, // 单价
        { wch: 15 }, // 房屋总价
        { wch: 10 }, // 车位数量
        { wch: 12 }, // 车位底价
        { wch: 8 },  // 溢价率
        { wch: 15 }, // 含车位总价
        { wch: 15 }, // 买方
        { wch: 12 }, // 下订日期
        { wch: 12 }, // 签约日期
        { wch: 10 }, // 销售人员
        { wch: 12 }, // 媒体来源
        { wch: 10 }, // 介绍人
        { wch: 20 }, // 客变内容
        { wch: 20 }  // 备注
      ]
      ws['!cols'] = colWidths

      const fileName = `销控数据_项目${projectId}_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      message.success('Excel文件导出成功')
    } catch (error) {
      console.error('Excel导出失败:', error)
      message.error('Excel导出失败')
    }
  }

  // PDF导出 - 使用HTML模板转换
  const handlePdfExport = async () => {
    try {
      // 创建HTML模板
      const htmlTemplate = createPdfHtmlTemplate()
      
      // 创建临时DOM元素
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlTemplate
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '1200px'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.padding = '20px'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      
      document.body.appendChild(tempDiv)
      
      // 使用html2canvas转换为图片
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1200,
        height: tempDiv.scrollHeight
      })
      
      // 移除临时元素
      document.body.removeChild(tempDiv)
      
      // 创建PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('l', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      
      const fileName = `销控数据_项目${projectId}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      message.success('PDF文件导出成功')
    } catch (error) {
      console.error('PDF导出失败:', error)
      message.error('PDF导出失败')
    }
  }
  


  // 创建PDF的HTML模板
  const createPdfHtmlTemplate = () => {
    const currentDate = new Date().toLocaleString('zh-CN')
    
    const tableRows = data.map(item => `
      <tr>
        <td style="width: 10%; text-align: center; border: 1px solid #ddd; padding: 6px; font-size: 11px;">${item.house_no || ''}</td>
        <td style="width: 8%; text-align: center; border: 1px solid #ddd; padding: 6px; font-size: 11px;">${item.building || ''}</td>
        <td style="width: 6%; text-align: center; border: 1px solid #ddd; padding: 6px; font-size: 11px;">${item.floor || ''}</td>
        <td style="width: 8%; text-align: center; border: 1px solid #ddd; padding: 6px; font-size: 11px;">${item.unit || ''}</td>
        <td style="width: 8%; text-align: center; border: 1px solid #ddd; padding: 6px; font-size: 11px;">${item.area || ''}</td>
        <td style="width: 8%; text-align: center; border: 1px solid #ddd; padding: 6px; font-size: 11px;">${item.sales_status || ''}</td>
        <td style="width: 12%; text-align: right; border: 1px solid #ddd; padding: 6px; font-size: 11px;">${formatCurrency(parseFloat(item.unit_price) || 0)}</td>
        <td style="width: 15%; text-align: right; border: 1px solid #ddd; padding: 6px; font-size: 11px;">${formatCurrency(parseFloat(item.house_total) || 0)}</td>
        <td style="width: 12%; text-align: center; border: 1px solid #ddd; padding: 6px; font-size: 11px;">${item.buyer || ''}</td>
        <td style="width: 13%; text-align: center; border: 1px solid #ddd; padding: 6px; font-size: 11px;">${item.sales_person_name || ''}</td>
      </tr>
    `).join('')
    
    return `
      <div style="padding: 20px; font-family: 'Microsoft YaHei', Arial, sans-serif; font-size: 12px; background: white;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #333; font-weight: bold;">项目${projectId} 销控数据报表</h1>
          <p style="margin: 10px 0; color: #666; font-size: 14px;">导出时间: ${currentDate}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed;">
          <thead>
            <tr style="background-color: #4285f4; color: white;">
              <th style="width: 10%; border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;">房屋编号</th>
              <th style="width: 8%; border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;">楼栋</th>
              <th style="width: 6%; border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;">楼层</th>
              <th style="width: 8%; border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;">房型</th>
              <th style="width: 8%; border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;">面积</th>
              <th style="width: 8%; border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;">销售状态</th>
              <th style="width: 12%; border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;">单价</th>
              <th style="width: 15%; border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;">房屋总价</th>
              <th style="width: 12%; border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;">买方</th>
              <th style="width: 13%; border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;">销售人员</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0; font-weight: bold;">共 ${data.length} 条记录</p>
          <p style="margin: 5px 0 0 0; font-size: 10px;">注：单价和房屋总价以台币计算</p>
        </div>
      </div>
    `
  }

  // 文件上传处理
  const handleFileUpload: UploadProps['customRequest'] = ({ file, onSuccess, onError }) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          if (jsonData.length < 2) {
            throw new Error('文件内容为空或格式不正确')
          }

          // 解析数据
          const headers = jsonData[0] as string[]
          const rows = jsonData.slice(1) as any[][]
          
          // 验证必要的列
          const requiredColumns = ['房屋编号', '楼栋', '楼层']
          const missingColumns = requiredColumns.filter(col => !headers.includes(col))
          
          if (missingColumns.length > 0) {
            throw new Error(`缺少必要的列: ${missingColumns.join(', ')}`)
          }

          // 转换为预览数据
          const preview = rows.map((row, index) => {
            const item: PreviewData = { _rowIndex: index + 2 }
            headers.forEach((header, colIndex) => {
              item[header] = row[colIndex] || ''
            })
            return item
          })

          // 生成预览表格列
          const columns = headers.map(header => ({
            title: header,
            dataIndex: header,
            key: header,
            width: 120,
            ellipsis: true
          }))

          setPreviewData(preview)
          setPreviewColumns(columns)
          setImportErrors([])
          setIsPreviewModalOpen(true)
          
          onSuccess?.({})
        } catch (error) {
          console.error('文件解析失败:', error)
          onError?.(error as Error)
          message.error(`文件解析失败: ${(error as Error).message}`)
        }
      }
      
      reader.readAsArrayBuffer(file as File)
    } catch (error) {
      console.error('文件读取失败:', error)
      onError?.(error as Error)
      message.error('文件读取失败')
    }
  }

  // 确认导入
  const handleConfirmImport = () => {
    try {
      // 验证数据并转换格式
      const errors: string[] = []
      const importData: SalesControlData[] = []

      previewData.forEach((row, index) => {
        const rowNum = row._rowIndex
        
        // 验证必要字段
        if (!row['房屋编号']) {
          errors.push(`第${rowNum}行: 房屋编号不能为空`)
          return
        }
        
        if (!row['楼栋']) {
          errors.push(`第${rowNum}行: 楼栋不能为空`)
          return
        }

        // 转换数据格式
        const item: Partial<SalesControlData> = {
          house_no: row['房屋编号'],
          building: row['楼栋'],
          floor: parseInt(row['楼层']) || 0,
          unit: row['房型'],
          area: row['面积'],
          sales_status: row['销售状态'] || '未售出',
          unit_price: row['单价'],
          house_total: row['房屋总价'],
          parking_spaces: [],
          base_price: row['车位底价'],
          premium_rate: row['溢价率'],
          total_with_parking: row['含车位总价'],
          buyer: row['买方'],
          deposit_date: row['下订日期'],
          sign_date: row['签约日期'],
          sales_person_name: row['销售人员'],
          media_source: row['媒体来源'],
          introducer: row['介绍人'],
          custom_change_content: row['客变内容'],
          notes: row['备注'],
          project_id: projectId
        }

        importData.push(item as SalesControlData)
      })

      if (errors.length > 0) {
        setImportErrors(errors)
        return
      }

      // 执行导入
      onImport(importData)
      setIsPreviewModalOpen(false)
      setIsImportModalOpen(false)
      setFileList([])
      message.success(`成功导入 ${importData.length} 条数据`)
    } catch (error) {
      console.error('导入失败:', error)
      message.error('导入失败')
    }
  }

  return (
    <>
      <Space>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setIsImportModalOpen(true)}
        >
          导入数据
        </Button>
        
        <Button
          icon={<FileExcelOutlined />}
          onClick={handleExcelExport}
        >
          导出Excel
        </Button>
        
        <Button
          icon={<FilePdfOutlined />}
          onClick={handlePdfExport}
        >
          导出PDF
        </Button>
      </Space>

      {/* 导入模态框 */}
      <Modal
        title="导入销控数据"
        open={isImportModalOpen}
        onCancel={() => {
          setIsImportModalOpen(false)
          setFileList([])
        }}
        footer={null}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          <Alert
            message="导入说明"
            description={
              <div>
                <p>1. 支持Excel文件格式（.xlsx, .xls）</p>
                <p>2. 必须包含以下列：房屋编号、楼栋、楼层</p>
                <p>3. 导入前会显示预览，请仔细检查数据</p>
                <p>4. 重复的房屋编号将会覆盖现有数据</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
          
          <Upload
            customRequest={handleFileUpload}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            accept=".xlsx,.xls"
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>选择Excel文件</Button>
          </Upload>
        </div>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>数据预览</span>
            <Text type="secondary">({previewData.length} 条记录)</Text>
          </Space>
        }
        open={isPreviewModalOpen}
        onCancel={() => {
          setIsPreviewModalOpen(false)
          setImportErrors([])
        }}
        onOk={handleConfirmImport}
        okText="确认导入"
        cancelText="取消"
        width={1200}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        {importErrors.length > 0 && (
          <Alert
            message="数据验证错误"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {importErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Table
          columns={previewColumns}
          dataSource={previewData}
          rowKey="_rowIndex"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1500, y: 400 }}
          size="small"
        />
      </Modal>
    </>
  )
}

export default ImportExportTools