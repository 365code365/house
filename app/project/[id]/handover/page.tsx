'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Tag, Upload, Image } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined, EyeOutlined, UploadOutlined, CameraOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface HandoverItem {
  id: number
  buyer: string
  houseNo: string
  handoverDate: string | null
  scheduledDate: string | null
  responsiblePerson: string
  houseCondition: 'NORMAL' | 'DEFECTIVE' | 'PENDING'
  defectItems: string
  completionItems: string
  images: string[]
  remark: string
  createdAt: string
  updatedAt: string
}

interface HandoverFormData {
  buyer: string
  houseNo: string
  handoverDate: dayjs.Dayjs | null
  scheduledDate: dayjs.Dayjs | null
  responsiblePerson: string
  houseCondition: 'NORMAL' | 'DEFECTIVE' | 'PENDING'
  defectItems: string
  completionItems: string
  remark: string
}

export default function HandoverPage() {
  const params = useParams()
  const projectId = params.id as string
  const [handoverData, setHandoverData] = useState<HandoverItem[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<HandoverItem | null>(null)
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')

  // 模拟数据
  const mockData: HandoverItem[] = [
    {
      id: 1,
      buyer: '王小明',
      houseNo: 'A1-101',
      handoverDate: '2025/01/15',
      scheduledDate: '2025/01/10',
      responsiblePerson: '張工務',
      houseCondition: 'NORMAL',
      defectItems: '',
      completionItems: '水電檢查完成、油漆補強完成、清潔完成',
      images: [],
      remark: '點交順利完成',
      createdAt: '2025/01/05 10:30',
      updatedAt: '2025/01/15 14:20'
    },
    {
      id: 2,
      buyer: '李小華',
      houseNo: 'A1-102',
      handoverDate: null,
      scheduledDate: '2025/02/15',
      responsiblePerson: '陳工務',
      houseCondition: 'DEFECTIVE',
      defectItems: '浴室磁磚破損、廚房水龍頭漏水',
      completionItems: '水電檢查完成',
      images: [],
      remark: '等待缺失修復',
      createdAt: '2025/01/08 16:45',
      updatedAt: '2025/01/12 09:15'
    },
    {
      id: 3,
      buyer: '張大同',
      houseNo: 'A1-103',
      handoverDate: null,
      scheduledDate: '2025/03/01',
      responsiblePerson: '林工務',
      houseCondition: 'PENDING',
      defectItems: '',
      completionItems: '',
      images: [],
      remark: '預計2月底完工',
      createdAt: '2025/01/10 11:20',
      updatedAt: '2025/01/10 11:20'
    },
    {
      id: 4,
      buyer: '陳美玲',
      houseNo: 'A1-104',
      handoverDate: '2025/01/20',
      scheduledDate: '2025/01/18',
      responsiblePerson: '王工務',
      houseCondition: 'NORMAL',
      defectItems: '',
      completionItems: '全部檢查完成、清潔完成、鑰匙交付',
      images: [],
      remark: '客戶滿意',
      createdAt: '2025/01/12 14:10',
      updatedAt: '2025/01/20 16:30'
    },
    {
      id: 5,
      buyer: '林志明',
      houseNo: 'A1-105',
      handoverDate: null,
      scheduledDate: '2025/02/28',
      responsiblePerson: '劉工務',
      houseCondition: 'DEFECTIVE',
      defectItems: '陽台防水需重做、客廳燈具故障',
      completionItems: '水電檢查完成、油漆完成',
      images: [],
      remark: '缺失項目修復中',
      createdAt: '2025/01/15 09:45',
      updatedAt: '2025/01/18 13:25'
    }
  ]

  const responsiblePersons = [
    '張工務',
    '陳工務',
    '林工務',
    '王工務',
    '劉工務',
    '黃工務'
  ]

  useEffect(() => {
    // 模拟加载数据
    setHandoverData(mockData)
  }, [])

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setFileList([])
    // 设置默认值
    form.setFieldsValue({
      houseCondition: 'PENDING'
    })
    setIsModalVisible(true)
  }

  const handleEdit = (item: HandoverItem) => {
    setEditingItem(item)
    form.setFieldsValue({
      ...item,
      handoverDate: item.handoverDate ? dayjs(item.handoverDate) : null,
      scheduledDate: item.scheduledDate ? dayjs(item.scheduledDate) : null
    })
    // 设置图片列表
    const imageFiles = item.images.map((url, index) => ({
      uid: `${index}`,
      name: `image-${index}.jpg`,
      status: 'done' as const,
      url: url
    }))
    setFileList(imageFiles)
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      // 这里应该调用API删除数据
      setHandoverData(prev => prev.filter(item => item.id !== id))
      message.success('刪除成功')
    } catch (error) {
      message.error('刪除失敗')
    }
  }

  const handleSubmit = async (values: HandoverFormData) => {
    try {
      const handoverDate = values.handoverDate ? values.handoverDate.format('YYYY/MM/DD') : null
      const scheduledDate = values.scheduledDate ? values.scheduledDate.format('YYYY/MM/DD') : null
      const createdAt = dayjs().format('YYYY/MM/DD HH:mm')
      const updatedAt = dayjs().format('YYYY/MM/DD HH:mm')
      
      // 处理图片URL
      const images = fileList.map(file => file.url || file.response?.url || '')
      
      const newItem: HandoverItem = {
        id: editingItem ? editingItem.id : Date.now(),
        buyer: values.buyer,
        houseNo: values.houseNo,
        handoverDate,
        scheduledDate,
        responsiblePerson: values.responsiblePerson,
        houseCondition: values.houseCondition,
        defectItems: values.defectItems || '',
        completionItems: values.completionItems || '',
        images,
        remark: values.remark || '',
        createdAt: editingItem ? editingItem.createdAt : createdAt,
        updatedAt
      }

      if (editingItem) {
        setHandoverData(prev => prev.map(item => 
          item.id === editingItem.id ? newItem : item
        ))
        message.success('更新成功')
      } else {
        setHandoverData(prev => [...prev, newItem])
        message.success('新增成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
      setFileList([])
    } catch (error) {
      message.error('操作失敗')
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NORMAL': return 'green'
      case 'DEFECTIVE': return 'red'
      case 'PENDING': return 'orange'
      default: return 'default'
    }
  }

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'NORMAL': return '正常'
      case 'DEFECTIVE': return '待修'
      case 'PENDING': return '待檢'
      default: return condition
    }
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File)
    }
    setPreviewImage(file.url || (file.preview as string))
    setPreviewVisible(true)
  }

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })

  const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList)
  }

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上傳</div>
    </div>
  )

  const columns = [
    {
      title: '買方姓名',
      dataIndex: 'buyer',
      key: 'buyer',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '房號',
      dataIndex: 'houseNo',
      key: 'houseNo',
      width: 100,
    },
    {
      title: '預定點交日期',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 130,
      render: (date: string | null) => date || '-',
      sorter: (a: HandoverItem, b: HandoverItem) => {
        if (!a.scheduledDate && !b.scheduledDate) return 0
        if (!a.scheduledDate) return 1
        if (!b.scheduledDate) return -1
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      },
    },
    {
      title: '實際點交日期',
      dataIndex: 'handoverDate',
      key: 'handoverDate',
      width: 130,
      render: (date: string | null) => date || '-',
      sorter: (a: HandoverItem, b: HandoverItem) => {
        if (!a.handoverDate && !b.handoverDate) return 0
        if (!a.handoverDate) return 1
        if (!b.handoverDate) return -1
        return new Date(a.handoverDate).getTime() - new Date(b.handoverDate).getTime()
      },
    },
    {
      title: '負責工務',
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
      width: 100,
    },
    {
      title: '房子狀況',
      dataIndex: 'houseCondition',
      key: 'houseCondition',
      width: 100,
      render: (condition: string) => (
        <Tag color={getConditionColor(condition)}>
          {getConditionText(condition)}
        </Tag>
      ),
      filters: [
        { text: '正常', value: 'NORMAL' },
        { text: '待修', value: 'DEFECTIVE' },
        { text: '待檢', value: 'PENDING' },
      ],
      onFilter: (value: any, record: HandoverItem) => record.houseCondition === value,
    },
    {
      title: '缺失項目',
      dataIndex: 'defectItems',
      key: 'defectItems',
      width: 200,
      render: (text: string) => text || '-',
      ellipsis: true,
    },
    {
      title: '完成項目',
      dataIndex: 'completionItems',
      key: 'completionItems',
      width: 200,
      render: (text: string) => text || '-',
      ellipsis: true,
    },
    {
      title: '現況照片',
      key: 'images',
      width: 100,
      render: (record: HandoverItem) => (
        <div>
          {record.images.length > 0 ? (
            <Button 
              type="link" 
              icon={<CameraOutlined />}
              onClick={() => {
                setPreviewImage(record.images[0])
                setPreviewVisible(true)
              }}
            >
              {record.images.length}張
            </Button>
          ) : (
            <span style={{ color: '#ccc' }}>無照片</span>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (record: HandoverItem) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          <Popconfirm
            title="確定要刪除這筆記錄嗎？"
            onConfirm={() => handleDelete(record.id)}
            okText="確定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              刪除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card 
        title="點交管理" 
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增點交記錄
            </Button>
            <Button icon={<ExportOutlined />}>
              匯出資料
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={handoverData}
          rowKey="id"
          scroll={{ x: 1400, y: 600 }}
          pagination={{
            total: handoverData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
        />
      </Card>

      <Modal
        title={editingItem ? '編輯點交記錄' : '新增點交記錄'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
          setFileList([])
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="buyer"
              label="買方姓名"
              rules={[{ required: true, message: '請輸入買方姓名' }]}
            >
              <Input placeholder="請輸入買方姓名" />
            </Form.Item>

            <Form.Item
              name="houseNo"
              label="點交位置（房號）"
              rules={[{ required: true, message: '請輸入房號' }]}
            >
              <Input placeholder="請輸入房號" />
            </Form.Item>

            <Form.Item
              name="scheduledDate"
              label="預定點交日期"
              rules={[{ required: true, message: '請選擇預定點交日期' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="請選擇預定點交日期" />
            </Form.Item>

            <Form.Item
              name="handoverDate"
              label="實際點交日期"
            >
              <DatePicker style={{ width: '100%' }} placeholder="請選擇實際點交日期" />
            </Form.Item>

            <Form.Item
              name="responsiblePerson"
              label="負責工務"
              rules={[{ required: true, message: '請選擇負責工務' }]}
            >
              <Select placeholder="請選擇負責工務">
                {responsiblePersons.map(person => (
                  <Option key={person} value={person}>{person}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="houseCondition"
              label="房子狀況"
              rules={[{ required: true, message: '請選擇房子狀況' }]}
            >
              <Select placeholder="請選擇房子狀況">
                <Option value="NORMAL">正常</Option>
                <Option value="DEFECTIVE">待修</Option>
                <Option value="PENDING">待檢</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="defectItems"
            label="缺失項目"
          >
            <TextArea rows={3} placeholder="請輸入缺失項目" />
          </Form.Item>

          <Form.Item
            name="completionItems"
            label="完成項目"
          >
            <TextArea rows={3} placeholder="請輸入完成項目" />
          </Form.Item>

          <Form.Item
            label="現況照片"
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleUploadChange}
              beforeUpload={() => false} // 阻止自動上傳
            >
              {fileList.length >= 8 ? null : uploadButton}
            </Upload>
          </Form.Item>

          <Form.Item
            name="remark"
            label="備註"
          >
            <TextArea rows={3} placeholder="請輸入備註" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false)
                form.resetFields()
                setFileList([])
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? '更新' : '新增'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewVisible}
        title="照片預覽"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <Image
          alt="預覽"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
    </div>
  )
}