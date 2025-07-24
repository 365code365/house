-- SQLite 初始化腳本
CREATE TABLE IF NOT EXISTS project (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  main_image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_personnel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_control (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  house_no TEXT NOT NULL UNIQUE,
  building TEXT NOT NULL,
  floor INTEGER NOT NULL,
  unit TEXT NOT NULL,
  area REAL,
  unit_price REAL,
  total_price REAL,
  status TEXT DEFAULT '待售',
  buyer_name TEXT,
  buyer_phone TEXT,
  contract_date DATE,
  sales_person_id INTEGER,
  project_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES project(id),
  FOREIGN KEY (sales_person_id) REFERENCES sales_personnel(id)
);

CREATE TABLE IF NOT EXISTS parking_space (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parking_no TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT '平面',
  price REAL,
  status TEXT DEFAULT '待售',
  buyer_name TEXT,
  buyer_phone TEXT,
  contract_date DATE,
  sales_person_id INTEGER,
  project_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES project(id),
  FOREIGN KEY (sales_person_id) REFERENCES sales_personnel(id)
);

CREATE TABLE IF NOT EXISTS customer_appointment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  sales_person_id INTEGER NOT NULL,
  status TEXT DEFAULT '待確認',
  remark TEXT,
  project_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_person_id) REFERENCES sales_personnel(id),
  FOREIGN KEY (project_id) REFERENCES project(id)
);

-- 插入示例數據
INSERT OR IGNORE INTO project (name, main_image) VALUES ('示例建案', '/images/sample-project.jpg');
INSERT OR IGNORE INTO sales_personnel (employee_no, name, email, password, phone) VALUES ('EMP001', '張三', 'zhang@example.com', 'password123', '0912345678');