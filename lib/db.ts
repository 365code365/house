import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'sales_system',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+08:00'
}

let connection: mysql.Connection | null = null

export async function getConnection() {
  if (!connection) {
    try {
      connection = await mysql.createConnection(dbConfig)
      console.log('資料庫連接成功')
    } catch (error) {
      console.error('資料庫連接失敗:', error)
      throw error
    }
  }
  return connection
}

export async function executeQuery(query: string, params: any[] = []) {
  try {
    const conn = await getConnection()
    const [results] = await conn.execute(query, params || [])
    return results
  } catch (error) {
    console.error('查詢執行失敗:', error)
    throw error
  }
}

export async function closeConnection() {
  if (connection) {
    await connection.end()
    connection = null
    console.log('資料庫連接已關閉')
  }
}

// 資料庫初始化函數
export async function initDatabase() {
  try {
    const conn = await getConnection()
    
    // 檢查資料庫是否存在，如果不存在則創建
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await conn.query(`USE ${dbConfig.database}`)
    
    // 創建projects表（注意表名是projects而不是project）
    await conn.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '建案ID',
        name VARCHAR(100) NOT NULL COMMENT '建案名稱',
        main_image VARCHAR(255) COMMENT '建案主視覺圖路徑',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
        UNIQUE KEY uk_name (name)
      ) ENGINE=InnoDB COMMENT '建案資訊表'
    `)
    
    // 先刪除舊的parking_spaces表（如果存在）
    await conn.query(`DROP TABLE IF EXISTS parking_spaces`)
    
    // 創建parking_spaces表
    await conn.query(`
      CREATE TABLE parking_spaces (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '車位ID',
        project_id INT NOT NULL COMMENT '所屬建案ID',
        space_number VARCHAR(50) NOT NULL COMMENT '車位編號',
        type ENUM('平面','機械上層','機械中層','機械下層','機械平移','機車位','腳踏車位','自設','法定') COMMENT '車位類型',
        location VARCHAR(100) COMMENT '位置',
        price DECIMAL(15,2) NOT NULL COMMENT '車位價格（萬元）',
        status ENUM('available','sold','reserved') DEFAULT 'available' COMMENT '狀態',
        customer_name VARCHAR(255) COMMENT '買方姓名',
        sales_person VARCHAR(100) COMMENT '銷售人員',
        contract_date DATE COMMENT '簽約日期',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_space_number (project_id, space_number),
        KEY idx_project (project_id)
      ) ENGINE=InnoDB COMMENT '停車位資訊表'
    `)
    
    // 創建appointments表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '預約ID',
        project_id INT NOT NULL COMMENT '所屬建案ID',
        customer_name VARCHAR(100) NOT NULL COMMENT '客戶姓名',
        customer_phone VARCHAR(20) NOT NULL COMMENT '客戶電話',
        customer_email VARCHAR(100) COMMENT '客戶郵箱',
        appointment_date DATE NOT NULL COMMENT '預約日期',
        appointment_time TIME NOT NULL COMMENT '預約時間',
        status ENUM('scheduled','confirmed','cancelled','completed') DEFAULT 'scheduled' COMMENT '預約狀態',
        purpose VARCHAR(200) NOT NULL COMMENT '預約目的',
        sales_person VARCHAR(100) COMMENT '負責銷售人員',
        notes TEXT COMMENT '備註',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
        KEY idx_project (project_id),
        KEY idx_date (appointment_date),
        KEY idx_status (status)
      ) ENGINE=InnoDB COMMENT '客戶預約表'
    `)

    // 插入示例項目數據
    await conn.query(`
      INSERT IGNORE INTO projects (id, name, main_image) VALUES 
      (1, '示例建案1', NULL),
      (2, '示例建案2', NULL),
      (3, '示例建案3', NULL),
      (4, '示例建案4', NULL),
      (5, '示例建案5', NULL),
      (6, '示例建案6', NULL),
      (7, '示例建案7', NULL),
      (8, '示例建案8', NULL)
    `)
    
    console.log('資料庫初始化完成')
  } catch (error) {
    console.error('資料庫初始化失敗:', error)
    throw error
  }
}

// 類型定義
export interface Project {
  id: number
  name: string
  main_image?: string
  created_at: Date
  updated_at: Date
}

export interface SalesPersonnel {
  id: number
  employee_no: string
  name: string
  email: string
  password: string
  phone?: string
  project_ids?: string
  remark?: string
  created_at: Date
  updated_at: Date
}

export interface SalesControl {
  id: number
  house_no: string
  building: string
  floor: number
  unit: string
  area?: number
  unit_price?: number
  house_total?: number
  total_with_parking?: number
  sales_status: '售出' | '訂金' | '不銷售' | '未售出'
  sales_date?: Date
  deposit_date?: Date
  sign_date?: Date
  buyer?: string
  sales_person_id?: number
  parking_ids?: string
  custom_change?: boolean
  custom_change_content?: string
  media_source?: string
  introducer?: string
  remark?: string
  base_price?: number
  premium_rate?: number
  project_id: number
  created_at: Date
  updated_at: Date
}

export interface ParkingSpace {
  id: number
  project_id: number
  space_number: string
  type?: '平面' | '機械上層' | '機械中層' | '機械下層' | '機械平移' | '機車位' | '腳踏車位' | '自設' | '法定'
  location?: string
  price: number
  status: 'available' | 'sold' | 'reserved'
  customer_name?: string
  sales_person?: string
  contract_date?: string
  created_at: Date
  updated_at: Date
}

export interface CustomerAppointment {
  id: number
  customer_name: string
  phone: string
  start_time: Date
  end_time: Date
  sales_person_id: number
  status: '待確認' | '已確認' | '已取消'
  remark?: string
  project_id: number
  created_at: Date
  updated_at: Date
}

export interface PurchasedCustomer {
  id: number
  name: string
  house_no: string
  purchase_date?: Date
  id_card?: string
  is_corporate: boolean
  email?: string
  phone?: string
  age?: number
  occupation?: string
  registered_address?: string
  mailing_address?: string
  remark?: string
  rating?: 'S' | 'A' | 'B' | 'C' | 'D'
  project_id: number
  created_at: Date
  updated_at: Date
}

export interface VisitorQuestionnaire {
  id: number
  questionnaire_date: Date
  name?: string
  age?: number
  gender?: '男' | '女' | '不透露'
  landline?: string
  phone?: string
  email?: string
  occupation?: string
  receptionist_id?: number
  visited_house?: string
  purchase_timeline?: '半年內' | '一年內' | '其他'
  demand_type?: '結構體' | '成屋' | '預售屋'
  ideal_area?: '21坪以下' | '21-30坪' | '31-40坪' | '41-50坪' | '51坪以上' | '其他'
  room_demand?: '二房' | '三房' | '四房' | '店面' | '其他'
  budget_range?: string
  considerations?: string
  satisfaction_factors?: string
  residence_area?: string
  purchase_motive?: '首購' | '換屋' | '投資置產' | '為子女購屋' | '其他'
  info_sources?: string
  rating?: 'S' | 'A' | 'B' | 'C' | 'D'
  project_id: number
  created_at: Date
  updated_at: Date
}