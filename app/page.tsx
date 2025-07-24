'use client'

import { useState, useEffect } from 'react'
import { PlusOutlined, BuildOutlined } from '@ant-design/icons'
import { Button, Card, Modal, Input, Upload, Spin, Row, Col, Typography, Space } from 'antd'
import Link from 'next/link'
import Image from 'next/image'

const { Title, Paragraph } = Typography
const { Meta } = Card

interface Project {
  id: number
  name: string
  main_image?: string
  created_at: string
  updated_at: string
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectImage, setNewProjectImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)

  useEffect(() => {
    // 初始化數據庫
    const initDB = async () => {
      try {
        await fetch('/api/init-db', { method: 'POST' })
      } catch (error) {
        console.error('數據庫初始化失敗:', error)
      }
    }
    
    initDB().then(() => {
      fetchProjects()
    })
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('獲取建案列表失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      return
    }

    setCreateLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', newProjectName)
      if (newProjectImage) {
        formData.append('image', newProjectImage)
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const newProject = await response.json()
        setProjects([...projects, newProject])
        setIsCreateModalOpen(false)
        setNewProjectName('')
        setNewProjectImage(null)
      } else {
        const error = await response.json()
        console.error('建立建案失敗:', error.message)
      }
    } catch (error) {
      console.error('建立建案失敗:', error)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewProjectImage(file)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="載入中...">
          <div className="text-center p-8">
            <BuildOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </div>
        </Spin>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* 標題區域 */}
        <div className="text-center mb-12">
          <Title level={1} style={{ color: '#1f2937', marginBottom: '16px' }}>
            銷售管理系統
          </Title>
          <Paragraph style={{ fontSize: '18px', color: '#6b7280' }}>
            專業的房地產建案銷控與客戶管理平台
          </Paragraph>
        </div>

        {/* 建案網格 */}
        <Row gutter={[24, 24]}>
          {/* 新增建案卡片 */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              style={{ height: 280, cursor: 'pointer' }}
              styles={{ body: { 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                border: '2px dashed #d9d9d9'
              } }}
              onClick={() => setIsCreateModalOpen(true)}
            >
              <PlusOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '16px' }} />
              <p style={{ color: '#8c8c8c', fontWeight: 500, margin: 0 }}>新增建案</p>
            </Card>
          </Col>

          <Modal
            title="新增建案"
            open={isCreateModalOpen}
            onOk={handleCreateProject}
            onCancel={() => setIsCreateModalOpen(false)}
            confirmLoading={createLoading}
            okText="建立"
            cancelText="取消"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>建案名稱</label>
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="請輸入建案名稱"
                  size="large"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>建案主視覺圖</label>
                <Upload
                  beforeUpload={(file) => {
                    setNewProjectImage(file)
                    return false
                  }}
                  maxCount={1}
                  accept="image/*"
                >
                  <Button icon={<PlusOutlined />}>選擇圖片</Button>
                </Upload>
              </div>
            </Space>
          </Modal>

          {/* 建案卡片 */}
          {projects.map((project) => (
            <Col key={project.id} xs={24} sm={12} md={8} lg={6}>
              <Link href={`/project/${project.id}`} style={{ textDecoration: 'none' }}>
                <Card
                  hoverable
                  style={{ height: 280 }}
                  styles={{ body: { padding: 0, height: '100%', position: 'relative', overflow: 'hidden' } }}
                  cover={
                    project.main_image ? (
                      <div style={{ height: 200, position: 'relative' }}>
                        <Image
                          src={project.main_image}
                          alt={project.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div 
                        style={{ 
                          height: 200, 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                        }} 
                      />
                    )
                  }
                >
                  <Meta
                    title={project.name}
                    description={`建立時間：${new Date(project.created_at).toLocaleDateString('zh-TW')}`}
                    style={{ padding: '16px' }}
                  />
                </Card>
              </Link>
            </Col>
          ))}
        </Row>

        {/* 空狀態 */}
        {projects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <BuildOutlined style={{ fontSize: '64px', color: '#bfbfbf', marginBottom: '16px' }} />
            <Title level={3} style={{ color: '#8c8c8c', marginBottom: '8px' }}>
              尚未建立任何建案
            </Title>
            <Paragraph style={{ color: '#bfbfbf', marginBottom: '24px' }}>
              點擊上方的「新增建案」按鈕開始建立您的第一個建案
            </Paragraph>
          </div>
        )}
      </div>
    </div>
  )
}