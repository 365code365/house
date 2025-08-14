"use client"

import React, { useState } from 'react'
import { Modal, Form, Input, Switch, ColorPicker, Select, Upload, Button, Space, Divider, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'

interface CommonPDFConfigProps {
  visible: boolean
  onCancel: () => void
  onConfirm: (config: any) => void
  initialConfig?: any
  title?: string
}

export interface CommonPDFConfig {
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

const defaultConfig: CommonPDFConfig = {
  title: '報表',
  subtitle: '數據統計報表',
  companyName: '房地產管理系統',
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

const CommonPDFConfig: React.FC<CommonPDFConfigProps> = ({
  visible,
  onCancel,
  onConfirm,
  initialConfig = defaultConfig,
  title = 'PDF模板配置'
}) => {
  const [form] = Form.useForm()
  const [logoFile, setLogoFile] = useState<UploadFile | null>(null)

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialConfig)
    }
  }, [visible, initialConfig, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const config = {
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
    message.success('已重置為默認配置')
  }

  const quickPresets = [
    {
      name: '默認樣式',
      config: defaultConfig
    },
    {
      name: '商務風格',
      config: {
        ...defaultConfig,
        headerColor: '#722ed1',
        accentColor: '#722ed1',
        tableStyle: 'bordered'
      }
    },
    {
      name: '簡潔風格',
      config: {
        ...defaultConfig,
        headerColor: '#13c2c2',
        accentColor: '#13c2c2',
        tableStyle: 'simple',
        fontSize: 'small'
      }
    }
  ]

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      width={800}
      okText="確認"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialConfig}
        style={{ marginTop: 20 }}
      >
        {/* 快速预设 */}
        <div style={{ marginBottom: 20 }}>
          <h4>快速预设</h4>
          <Space wrap>
            {quickPresets.map((preset, index) => (
              <Button
                key={index}
                size="small"
                onClick={() => {
                  form.setFieldsValue(preset.config)
                  message.success(`已應用${preset.name}`)
                }}
              >
                {preset.name}
              </Button>
            ))}
          </Space>
        </div>

        <Divider />

        {/* 基本信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Form.Item
            name="title"
            label="報表標題"
            rules={[{ required: true, message: '請輸入報表標題' }]}
          >
            <Input placeholder="報表標題" />
          </Form.Item>

          <Form.Item
            name="subtitle"
            label="副標題"
          >
            <Input placeholder="數據統計報表" />
          </Form.Item>

          <Form.Item
            name="companyName"
            label="公司名稱"
            rules={[{ required: true, message: '請輸入公司名稱' }]}
          >
            <Input placeholder="房地產管理系統" />
          </Form.Item>

          <Form.Item
            name="pageOrientation"
            label="頁面方向"
          >
            <Select>
              <Select.Option value="landscape">橫向</Select.Option>
              <Select.Option value="portrait">縱向</Select.Option>
            </Select>
          </Form.Item>
        </div>

        {/* Logo设置 */}
        <Form.Item label="Logo設置">
          <Space>
            <Switch
              checked={form.getFieldValue('showLogo')}
              onChange={(checked) => form.setFieldsValue({ showLogo: checked })}
            />
            <span>顯示Logo</span>
            {form.getFieldValue('showLogo') && (
              <Upload
                accept="image/*"
                beforeUpload={() => false}
                onChange={({ fileList }) => {
                  if (fileList.length > 0) {
                    handleLogoUpload(fileList[0])
                  }
                }}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />} size="small">
                  上傳Logo
                </Button>
              </Upload>
            )}
          </Space>
        </Form.Item>

        {/* 显示选项 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <Form.Item
            name="showDate"
            label="顯示日期"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="showPageNumber"
            label="顯示頁碼"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="showSummary"
            label="顯示統計摘要"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </div>

        {/* 样式设置 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Form.Item
            name="headerColor"
            label="標題顏色"
          >
            <ColorPicker />
          </Form.Item>

          <Form.Item
            name="accentColor"
            label="強調顏色"
          >
            <ColorPicker />
          </Form.Item>

          <Form.Item
            name="fontSize"
            label="字體大小"
          >
            <Select>
              <Select.Option value="small">小</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="large">大</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tableStyle"
            label="表格樣式"
          >
            <Select>
              <Select.Option value="simple">簡潔</Select.Option>
              <Select.Option value="striped">條紋</Select.Option>
              <Select.Option value="bordered">邊框</Select.Option>
            </Select>
          </Form.Item>
        </div>

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Space>
            <Button onClick={resetToDefault}>
              重置為默認
            </Button>
            <Button type="primary" onClick={handleOk}>
              預覽並導出
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  )
}

export default CommonPDFConfig
export { defaultConfig }
