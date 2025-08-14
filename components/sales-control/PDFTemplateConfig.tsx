"use client"

import React from 'react'
import { Modal, Form, Input, Switch, Select, Upload, Button, Space, ColorPicker } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'

interface PDFTemplateConfigProps {
  visible: boolean
  onCancel: () => void
  onConfirm: (config: PDFConfig) => void
  initialConfig?: PDFConfig
}

export interface PDFConfig {
  title: string
  subtitle: string
  companyName: string
  logoUrl?: string
  showDate: boolean
  dateFormat: string
  showPageNumber: boolean
  headerColor: string
  accentColor: string
  showSummary: boolean
  showLogo: boolean
  pageOrientation: 'portrait' | 'landscape'
  fontSize: 'small' | 'medium' | 'large'
  tableStyle: 'simple' | 'striped' | 'bordered'
  customStyles?: React.CSSProperties
}

const defaultConfig: PDFConfig = {
  title: '銷控管理報表',
  subtitle: '房地產銷售控制數據統計',
  companyName: '房地產銷控管理系統',
  showDate: true,
  dateFormat: 'YYYY-MM-DD',
  showPageNumber: true,
  headerColor: '#1890ff',
  accentColor: '#1890ff',
  showSummary: true,
  showLogo: false,
  pageOrientation: 'landscape',
  fontSize: 'medium',
  tableStyle: 'striped'
}

const PDFTemplateConfig: React.FC<PDFTemplateConfigProps> = ({
  visible,
  onCancel,
  onConfirm,
  initialConfig = defaultConfig
}) => {
  const [form] = Form.useForm()
  const [logoFile, setLogoFile] = React.useState<UploadFile | null>(null)

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialConfig)
    }
  }, [visible, initialConfig, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const config: PDFConfig = {
        ...values,
        logoUrl: logoFile ? URL.createObjectURL(logoFile.originFileObj!) : initialConfig.logoUrl
      }
      onConfirm(config)
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  const handleLogoUpload = (file: UploadFile) => {
    setLogoFile(file)
    return false // Prevent auto upload
  }

  const resetToDefault = () => {
    form.setFieldsValue(defaultConfig)
    setLogoFile(null)
  }

  return (
    <Modal
      title="PDF模板配置"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      width={600}
      okText="確認"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialConfig}
      >
        <Form.Item
          label="報表標題"
          name="title"
          rules={[{ required: true, message: '請輸入報表標題' }]}
        >
          <Input placeholder="請輸入報表標題" />
        </Form.Item>

        <Form.Item
          label="副標題"
          name="subtitle"
        >
          <Input placeholder="請輸入副標題" />
        </Form.Item>

        <Form.Item
          label="公司名稱"
          name="companyName"
          rules={[{ required: true, message: '請輸入公司名稱' }]}
        >
          <Input placeholder="請輸入公司名稱" />
        </Form.Item>

        <Form.Item
          label="顯示Logo"
          name="showLogo"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => 
            prevValues.showLogo !== currentValues.showLogo
          }
        >
          {({ getFieldValue }) => {
            return getFieldValue('showLogo') ? (
              <Form.Item label="公司Logo">
                <Upload
                  accept="image/*"
                  maxCount={1}
                  beforeUpload={handleLogoUpload}
                  fileList={logoFile ? [logoFile] : []}
                >
                  <Button icon={<UploadOutlined />}>選擇Logo圖片</Button>
                </Upload>
              </Form.Item>
            ) : null
          }}
        </Form.Item>

        <Form.Item
          label="頁面方向"
          name="pageOrientation"
        >
          <Select>
            <Select.Option value="landscape">橫向</Select.Option>
            <Select.Option value="portrait">縱向</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="字體大小"
          name="fontSize"
        >
          <Select>
            <Select.Option value="small">小</Select.Option>
            <Select.Option value="medium">中</Select.Option>
            <Select.Option value="large">大</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="表格樣式"
          name="tableStyle"
        >
          <Select>
            <Select.Option value="simple">簡潔</Select.Option>
            <Select.Option value="striped">條紋</Select.Option>
            <Select.Option value="bordered">邊框</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="主題色彩"
          name="headerColor"
        >
          <ColorPicker showText />
        </Form.Item>

        <Form.Item
          label="強調色彩"
          name="accentColor"
        >
          <ColorPicker showText />
        </Form.Item>

        <Form.Item
          label="顯示日期"
          name="showDate"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="顯示頁碼"
          name="showPageNumber"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="顯示統計摘要"
          name="showSummary"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="日期格式"
          name="dateFormat"
        >
          <Select>
            <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
            <Select.Option value="YYYY/MM/DD">YYYY/MM/DD</Select.Option>
            <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
            <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button onClick={resetToDefault}>恢復默認</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default PDFTemplateConfig
export { defaultConfig }
export type { PDFTemplateConfigProps }