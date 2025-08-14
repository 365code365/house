CREATE TABLE `company`
(
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `name`       VARCHAR(100) NOT NULL COMMENT '公司名稱',
    `account_id` VARCHAR(50)  NOT NULL COMMENT '帳號',
    `password`   VARCHAR(100) NOT NULL COMMENT '密碼',
    `address`    TEXT COMMENT '地址',
    `tax_id`     VARCHAR(20) COMMENT '統一編號',
    `phone`      VARCHAR(20) COMMENT '連絡電話'
);

CREATE TABLE `project`
(
    `id`         INT AUTO_INCREMENT PRIMARY KEY COMMENT '建案ID',
    `name`       VARCHAR(100) NOT NULL COMMENT '建案名稱',
    `main_image` VARCHAR(255) COMMENT '建案主視覺圖路徑',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB COMMENT '建案資訊表，用於管理多個建案的基本資訊，包含建案名稱與主視覺圖';



CREATE TABLE `sales_personnel`
(
    `id`          INT AUTO_INCREMENT PRIMARY KEY COMMENT '銷售人員ID',
    `employee_no` VARCHAR(50)  NOT NULL COMMENT '員工編號（主鍵）',
    `name`        VARCHAR(50)  NOT NULL COMMENT '姓名',
    `email`       VARCHAR(100) NOT NULL COMMENT '登入信箱（帳號）',
    `password`    VARCHAR(100) NOT NULL COMMENT '登入密碼（加密儲存）',
    `phone`       VARCHAR(20) COMMENT '電話號碼（格式：09xxxxxxxxx）',
    `project_ids` VARCHAR(255) COMMENT '關聯建案ID（逗號分隔，多建案）',
    `remark`      TEXT COMMENT '備註',
    `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_employee_no` (`employee_no`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB COMMENT '銷售人員資訊表，管理銷售人員的基本資料、權限及所負責建案';

CREATE TABLE `sales_control`
(
    `id`                    INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增ID',
    `house_no`              VARCHAR(50) NOT NULL COMMENT '房型編號（如A15A1）',
    `building`              VARCHAR(10) NOT NULL COMMENT '棟別（如A、B）',
    `floor`                 INT         NOT NULL COMMENT '樓層',
    `unit`                  VARCHAR(10) NOT NULL COMMENT '戶別（如A1、B2）',
    `area`                  DECIMAL(10, 2) COMMENT '坪數',
    `unit_price`            DECIMAL(15, 2) COMMENT '每坪單價（萬元）',
    `house_total`           DECIMAL(15, 2) COMMENT '房屋總價（萬元）',
    `total_with_parking`    DECIMAL(15, 2) COMMENT '含車位總價（萬元）',
    `sales_status`          ENUM('售出','訂金','不銷售','未售出') NOT NULL COMMENT '銷售狀態',
    `sales_date`            DATE COMMENT '銷售日期',
    `deposit_date`          DATE COMMENT '下訂日期',
    `sign_date`             DATE COMMENT '簽約日期',
    `buyer`                 VARCHAR(255) COMMENT '買方姓名（逗號分隔多買方）',
    `sales_id`              VARCHAR(50) COMMENT '銷售人員編號（關聯sales_personnel.employee_no）',
    `parking_ids`           VARCHAR(255) COMMENT '車位編號（逗號分隔多車位，關聯parking_space.id）',
    `custom_change`         TINYINT(1) COMMENT '客變需求（1=是，0=否）',
    `custom_change_content` TEXT COMMENT '客變內容',
    `media_source`          VARCHAR(100) COMMENT '媒體來源',
    `introducer`            VARCHAR(100) COMMENT '介紹人',
    `notes`                 TEXT COMMENT '備註',
    `base_price`            DECIMAL(15, 2) COMMENT '底價（萬元）',
    `premium_rate`          DECIMAL(10, 2) COMMENT '溢價率（%）',
    `project_id`            INT         NOT NULL COMMENT '所屬建案ID（關聯project.id）',
    `created_at`            DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_house_no` (`house_no`),
    KEY                     `idx_sales_id` (`sales_id`),
    KEY                     `idx_project` (`project_id`),
    CONSTRAINT `fk_sales_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),

) ENGINE=InnoDB COMMENT '房源銷控表，記錄各戶型的銷售狀態、價格、買方等核心資訊';

CREATE TABLE `parking_space`
(
    `id`           INT AUTO_INCREMENT PRIMARY KEY COMMENT '車位ID',
    `parking_no`   VARCHAR(50)    NOT NULL COMMENT '車位編號（如B1-103）',
    `type`         ENUM('平面','機械上層','機械中層','機械下層','機械平移','機車位','腳踏車位','自設','法定') COMMENT '車位類型',
    `price`        DECIMAL(15, 2) NOT NULL COMMENT '車位價格（萬元）',
    `sales_status` ENUM('售出','訂金','未售出') DEFAULT '未售出' COMMENT '銷售狀態',
    `sales_date`   DATE COMMENT '銷售日期（關聯簽約日期）',
    `buyer`        VARCHAR(255) COMMENT '買方姓名',
    `sales_id`     VARCHAR(50) COMMENT '銷售人員編號（關聯sales_personnel.employee_no）',
    `remark`       TEXT COMMENT '備註',
    `project_id`   INT            NOT NULL COMMENT '所屬建案ID（關聯project.id）',
    `created_at`   DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_parking_no` (`parking_no`),
    KEY            `idx_project` (`project_id`),
    CONSTRAINT `fk_parking_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),

) ENGINE=InnoDB COMMENT '停車位資訊表，管理車位編號、類型、價格及銷售狀態';


CREATE TABLE `customer_appointment`
(
    `id`            INT AUTO_INCREMENT PRIMARY KEY COMMENT '預約ID',
    `customer_name` VARCHAR(100) NOT NULL COMMENT '客戶姓名',
    `phone`         VARCHAR(20)  NOT NULL COMMENT '客戶電話（格式：09xxxxxxxxx）',
    `start_time`    DATETIME     NOT NULL COMMENT '開始時間',
    `end_time`      DATETIME     NOT NULL COMMENT '結束時間（需≤開始時間+3小時）',
    `sales_id`      VARCHAR(50)  NOT NULL COMMENT '接待人員編號（關聯sales_personnel.employee_no）',
    `status`        ENUM('待確認','已確認','已取消') DEFAULT '待確認' COMMENT '預約狀態',
    `remark`        TEXT COMMENT '備註',
    `project_id`    INT          NOT NULL COMMENT '所屬建案ID（關聯project.id）',
    `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY             `idx_sales_id` (`sales_id`),
    KEY             `idx_time` (`start_time`,`end_time`),

    CONSTRAINT `fk_appointment_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB COMMENT '客戶預約表，記錄客戶看房預約的時間、接待人員及狀態';


CREATE TABLE `purchased_customer`
(
    `id`                 INT AUTO_INCREMENT PRIMARY KEY COMMENT '記錄ID',
    `name`               VARCHAR(100) NOT NULL COMMENT '客戶姓名',
    `house_no`           VARCHAR(50)  NOT NULL COMMENT '房型編號（關聯sales_control.house_no）',
    `purchase_date`      DATE COMMENT '購買日期（簽約日期）',
    `id_card`            VARCHAR(50) COMMENT '身份證號/統一編號',
    `is_corporate`       TINYINT(1) DEFAULT 0 COMMENT '是否法人買家（1=是，0=否）',
    `email`              VARCHAR(100) COMMENT '電子郵箱',
    `phone`              VARCHAR(20) COMMENT '聯絡電話',
    `age`                INT COMMENT '年齡',
    `occupation`         VARCHAR(100) COMMENT '職業',
    `registered_address` TEXT COMMENT '戶籍地址',
    `mailing_address`    TEXT COMMENT '通訊地址',
    `remark`             TEXT COMMENT '備註',
    `rating`             ENUM('S','A','B','C','D') COMMENT '客戶評級',
    `project_id`         INT          NOT NULL COMMENT '所屬建案ID',
    `created_at`         DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY                  `idx_house_no` (`house_no`),
    CONSTRAINT `fk_purchased_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB COMMENT '已購客戶名單表，存儲已購房客戶的詳細資訊';

CREATE TABLE `visitor_questionnaire`
(
    `id`                   INT AUTO_INCREMENT PRIMARY KEY COMMENT '問卷ID',
    `questionnaire_date`   DATE NOT NULL COMMENT '問卷日期',
    `name`                 VARCHAR(100) COMMENT '訪客姓名',
    `age`                  INT COMMENT '年齡',
    `gender`               ENUM('男','女','不透露') COMMENT '性別',
    `landline`             VARCHAR(20) COMMENT '市話',
    `phone`                VARCHAR(20) COMMENT '手機',
    `email`                VARCHAR(100) COMMENT '電子郵箱',
    `occupation`           VARCHAR(100) COMMENT '職業',
    `receptionist_id`      VARCHAR(50) COMMENT '接待人員編號（關聯sales_personnel.employee_no）',
    `visited_house`        VARCHAR(50) COMMENT '參觀戶別（房型編號）',
    `purchase_timeline`    ENUM('半年內','一年內','其他') COMMENT '購屋時程',
    `demand_type`          ENUM('結構體','成屋','預售屋') COMMENT '需求類型',
    `ideal_area`           ENUM('21坪以下','21-30坪','31-40坪','41-50坪','51坪以上','其他') COMMENT '理想坪數',
    `room_demand`          ENUM('二房','三房','四房','店面','其他') COMMENT '房數需求',
    `budget_range`         VARCHAR(50) COMMENT '預算區間（如1000-1500萬）',
    `considerations`       TEXT COMMENT '購買考量（多選項，逗號分隔）',
    `satisfaction_factors` TEXT COMMENT '滿意因素（多選項，逗號分隔）',
    `residence_area`       VARCHAR(100) COMMENT '個人居住區域',
    `purchase_motive`      ENUM('首購','換屋','投資置產','為子女購屋','其他') COMMENT '購買動機',
    `info_sources`         TEXT COMMENT '資訊來源（多選項，逗號分隔）',
    `rating`               ENUM('S','A','B','C','D') COMMENT '評級',
    `project_id`           INT  NOT NULL COMMENT '所屬建案ID',
    `created_at`           DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY                    `idx_receptionist` (`receptionist_id`),

    CONSTRAINT `fk_questionnaire_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB COMMENT '訪客問卷表，記錄訪客的基本資訊、購屋需求及意見';

CREATE TABLE `withdrawal_record`
(
    `id`              INT AUTO_INCREMENT PRIMARY KEY COMMENT '退戶ID',
    `customer_name`   VARCHAR(100) NOT NULL COMMENT '客戶姓名',
    `building`        VARCHAR(10)  NOT NULL COMMENT '棟別',
    `floor`           INT          NOT NULL COMMENT '樓層',
    `unit`            VARCHAR(10)  NOT NULL COMMENT '戶別',
    `status`          ENUM('已申請','處理中','已完成','已取消') NOT NULL COMMENT '退戶狀態',
    `reason`          VARCHAR(100) COMMENT '退戶原因',
    `withdrawal_date` DATE         NOT NULL COMMENT '退戶日期',
    `house_price`     DECIMAL(15, 2) COMMENT '房價（萬元）',
    `unit_price`      DECIMAL(15, 2) COMMENT '房屋單價（萬元）',
    `parking_price`   DECIMAL(15, 2) COMMENT '車位價格（萬元）',
    `total_price`     DECIMAL(15, 2) COMMENT '含車位總價（萬元）',
    `house_no`        VARCHAR(50) COMMENT '關聯房型編號',
    `project_id`      INT          NOT NULL COMMENT '所屬建案ID',
    `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY               `idx_house_no` (`house_no`),
    CONSTRAINT `fk_withdrawal_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB COMMENT '退戶記錄表，記錄退戶的原因、狀態及相關價格資訊';

CREATE TABLE `budget_plan`
(
    `id`             INT AUTO_INCREMENT PRIMARY KEY COMMENT '預算ID',
    `category`       VARCHAR(100)   NOT NULL COMMENT '類別（如網路廣告、平面印刷）',
    `item`           VARCHAR(100) COMMENT '細項',
    `budget`         DECIMAL(15, 2) NOT NULL COMMENT '預算金額（萬元）',
    `actual_expense` DECIMAL(15, 2) DEFAULT 0 COMMENT '實際支出（自動計算：數量×單價）',
    `quantity`       INT            DEFAULT 1 COMMENT '數量',
    `unit`           VARCHAR(20) COMMENT '單位',
    `unit_price`     DECIMAL(15, 2) COMMENT '單價（萬元）',
    `vendor`         VARCHAR(100) COMMENT '廠商',
    `execution_rate` DECIMAL(10, 2) COMMENT '執行率（%，自動計算：actual_expense/budget×100）',
    `remark`         TEXT COMMENT '備註',
    `project_id`     INT            NOT NULL COMMENT '所屬建案ID',
    `created_at`     DATETIME       DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_budget_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB COMMENT '預算規劃表，管理各項支出的預算及執行狀況';


CREATE TABLE `expense_management`
(
    `id`             INT AUTO_INCREMENT PRIMARY KEY COMMENT '支出ID',
    `expense_date`   DATE         NOT NULL COMMENT '支出日期',
    `category`       VARCHAR(100) NOT NULL COMMENT '類別（關聯budget_plan.category）',
    `item`           VARCHAR(100) COMMENT '細項',
    `actual_expense` DECIMAL(15, 2) DEFAULT 0 COMMENT '實際支出（自動計算：數量×單價）',
    `quantity`       INT            DEFAULT 1 COMMENT '數量',
    `unit`           VARCHAR(20) COMMENT '單位',
    `unit_price`     DECIMAL(15, 2) COMMENT '單價（萬元）',
    `vendor`         VARCHAR(100) COMMENT '廠商',
    `invoice_no`     VARCHAR(50) COMMENT '發票號碼',
    `remark`         TEXT COMMENT '備註',
    `project_id`     INT          NOT NULL COMMENT '所屬建案ID',
    `created_at`     DATETIME       DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY              `idx_category` (`category`),
    CONSTRAINT `fk_expense_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB COMMENT '支出管理表，記錄實際發生的各項支出明細';


CREATE TABLE `commission_list`
(
    `id`                    INT AUTO_INCREMENT PRIMARY KEY COMMENT '請佣主ID',
    `building`              VARCHAR(10)    NOT NULL COMMENT '棟別',
    `area`                  DECIMAL(10, 2) COMMENT '坪數',
    `floor`                 INT            NOT NULL COMMENT '樓層',
    `unit`                  VARCHAR(10)    NOT NULL COMMENT '戶別',
    `status`                ENUM('售出','訂金') NOT NULL COMMENT '房源狀態',
    `sales_id`              VARCHAR(50)    NOT NULL COMMENT '銷售員編號',
    `sales_date`            DATE COMMENT '銷售日期（簽約日期）',
    `total_price`           DECIMAL(15, 2) COMMENT '房屋總價（萬元）',
    `total_with_parking`    DECIMAL(15, 2) NOT NULL COMMENT '含車位總價（萬元）',
    `total_commission_rate` DECIMAL(10, 2) DEFAULT 0 COMMENT '總請佣比例（%）',
    `total_commission`      DECIMAL(15, 2) DEFAULT 0 COMMENT '總請佣金額（自動計算）',
    `house_no`              VARCHAR(50) COMMENT '關聯房型編號',
    `project_id`            INT            NOT NULL COMMENT '所屬建案ID',
    `created_at`            DATETIME       DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY                     `idx_sales_id` (`sales_id`),

    CONSTRAINT `fk_commission_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB COMMENT '請佣列表主表，管理各戶型的請佣基本資訊';


CREATE TABLE `commission_details`
(
    `id`            INT AUTO_INCREMENT PRIMARY KEY COMMENT '明細ID',
    `commission_id` INT            NOT NULL COMMENT '關聯請佣主表ID',
    `commission_no` INT            NOT NULL COMMENT '請佣次數（1=第一次，2=第二次...）',
    `rate`          DECIMAL(10, 2) NOT NULL COMMENT '本次佣金額比例（%）',
    `status`        ENUM('已請傭','未請傭') DEFAULT '未請傭' COMMENT '請佣狀態',
    `amount`        DECIMAL(15, 2) NOT NULL COMMENT '本次請佣金額（自動計算）',
    `remark`        TEXT COMMENT '備註',
    `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_commission_no` (`commission_id`,`commission_no`),
    CONSTRAINT `fk_commission_detail` FOREIGN KEY (`commission_id`) REFERENCES `commission_list` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT '請佣明細表，記錄同一戶型的多次請佣記錄';


CREATE TABLE `deposit_management`
(
    `id`             INT AUTO_INCREMENT PRIMARY KEY COMMENT '訂金ID',
    `buyer`          VARCHAR(100)   NOT NULL COMMENT '買方姓名',
    `amount`         DECIMAL(15, 2) NOT NULL COMMENT '訂金金額（萬元）',
    `payment_status` ENUM('已結清','部分付款','未付款','逾期') DEFAULT '未付款' COMMENT '付款狀態',
    `payment_date`   DATE COMMENT '付款日期（下訂日期）',
    `due_date`       DATE           NOT NULL COMMENT '付款到期日',
    `auto_remind`    TINYINT(1) DEFAULT 1 COMMENT '自動提醒（1=開，0=關）',
    `remark`         TEXT COMMENT '備註',
    `house_no`       VARCHAR(50) COMMENT '關聯房型編號',
    `project_id`     INT            NOT NULL COMMENT '所屬建案ID',
    `created_at`     DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY              `idx_house_no` (`house_no`),
    CONSTRAINT `fk_deposit_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB COMMENT '訂金管理表，記錄訂金金額、付款狀態及提醒設置';


CREATE TABLE `handover_management`
(
    `id`              INT AUTO_INCREMENT PRIMARY KEY COMMENT '點交ID',
    `buyer`           VARCHAR(100) NOT NULL COMMENT '買方姓名',
    `house_no`        VARCHAR(50)  NOT NULL COMMENT '關聯房型編號',
    `handover_times`  INT          NOT NULL COMMENT '點交次數（1=第一次，2=第二次...）',
    `handover_date`   DATE         NOT NULL COMMENT '點交日期',
    `foreman`         VARCHAR(100) COMMENT '負責工務',
    `house_condition` ENUM('正常','待修') NOT NULL COMMENT '房屋屋況',
    `photo_paths`     TEXT COMMENT '現況照片路徑（逗號分隔多圖）',
    `signature_files` TEXT COMMENT '簽名字段路徑（PDF）',
    `remark`          TEXT COMMENT '備註',
    `project_id`      INT          NOT NULL COMMENT '所屬建案ID',
    `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_handover_times` (`house_no`,`handover_times`),
    CONSTRAINT `fk_handover_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB COMMENT '點交屋管理表，記錄房屋點交的次數、屋況及相關文件';