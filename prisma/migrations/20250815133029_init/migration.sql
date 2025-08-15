-- CreateTable
CREATE TABLE `company`
(
    `id`         INTEGER      NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(100) NOT NULL,
    `account_id` VARCHAR(50)  NOT NULL,
    `password`   VARCHAR(100) NOT NULL,
    `address`    TEXT NULL,
    `tax_id`     VARCHAR(20) NULL,
    `phone`      VARCHAR(20) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project`
(
    `id`         INTEGER      NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(100) NOT NULL,
    `main_image` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_personnel`
(
    `id`          INTEGER      NOT NULL AUTO_INCREMENT,
    `employee_no` VARCHAR(50)  NOT NULL,
    `name`        VARCHAR(50)  NOT NULL,
    `email`       VARCHAR(100) NOT NULL,
    `password`    VARCHAR(100) NOT NULL,
    `phone`       VARCHAR(20) NULL,
    `project_ids` VARCHAR(255) NULL,
    `remark`      TEXT NULL,
    `created_at`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_employee_no`(`employee_no`),
    UNIQUE INDEX `uk_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_control`
(
    `id`                    INTEGER     NOT NULL AUTO_INCREMENT,
    `house_no`              VARCHAR(50) NOT NULL,
    `building`              VARCHAR(10) NOT NULL,
    `floor`                 INTEGER     NOT NULL,
    `unit`                  VARCHAR(10) NOT NULL,
    `area`                  DECIMAL(10, 2) NULL,
    `unit_price`            DECIMAL(15, 2) NULL,
    `house_total`           DECIMAL(15, 2) NULL,
    `total_with_parking`    DECIMAL(15, 2) NULL,
    `sales_status`          ENUM('售出', '訂金', '不銷售', '未售出') NOT NULL,
    `sales_date`            DATE NULL,
    `deposit_date`          DATE NULL,
    `sign_date`             DATE NULL,
    `buyer`                 VARCHAR(255) NULL,
    `sales_id`              VARCHAR(50) NULL,
    `parking_ids`           VARCHAR(255) NULL,
    `custom_change`         BOOLEAN NULL,
    `custom_change_content` TEXT NULL,
    `media_source`          VARCHAR(100) NULL,
    `introducer`            VARCHAR(100) NULL,
    `notes`                 TEXT NULL,
    `base_price`            DECIMAL(15, 2) NULL,
    `premium_rate`          DECIMAL(10, 2) NULL,
    `project_id`            INTEGER     NOT NULL,
    `created_at`            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX                   `idx_project`(`project_id`),
    INDEX                   `idx_sales_person`(`sales_id`),
    UNIQUE INDEX `sales_control_project_id_house_no_key`(`project_id`, `house_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parking_space`
(
    `id`           INTEGER        NOT NULL AUTO_INCREMENT,
    `parking_no`   VARCHAR(50)    NOT NULL,
    `type`         ENUM('平面', '機械上層', '機械中層', '機械下層', '機械平移', '機車位', '腳踏車位', '自設', '法定') NULL,
    `price`        DECIMAL(15, 2) NOT NULL,
    `sales_status` ENUM('售出', '訂金', '不銷售', '未售出') NOT NULL DEFAULT '未售出',
    `sales_date`   DATE NULL,
    `buyer`        VARCHAR(255) NULL,
    `remark`       TEXT NULL,
    `project_id`   INTEGER        NOT NULL,
    `created_at`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `location`     VARCHAR(100) NULL,
    `sales_id`     VARCHAR(50) NULL,

    INDEX          `idx_project`(`project_id`),
    UNIQUE INDEX `parking_space_project_id_parking_no_key`(`project_id`, `parking_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_appointment`
(
    `id`            INTEGER      NOT NULL AUTO_INCREMENT,
    `customer_name` VARCHAR(100) NOT NULL,
    `phone`         VARCHAR(20)  NOT NULL,
    `start_time`    DATETIME(3) NOT NULL,
    `end_time`      DATETIME(3) NOT NULL,
    `status`        ENUM('待確認', '已確認', '已完成', '已取消') NOT NULL DEFAULT '待確認',
    `remark`        TEXT NULL,
    `project_id`    INTEGER      NOT NULL,
    `created_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sales_id`      VARCHAR(50)  NOT NULL,

    INDEX           `customer_appointment_sales_id_idx`(`sales_id`),
    INDEX           `customer_appointment_project_id_fkey`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchased_customer`
(
    `id`                 INTEGER      NOT NULL AUTO_INCREMENT,
    `name`               VARCHAR(100) NOT NULL,
    `house_no`           VARCHAR(50)  NOT NULL,
    `purchase_date`      DATE NULL,
    `id_card`            VARCHAR(50) NULL,
    `is_corporate`       BOOLEAN      NOT NULL DEFAULT false,
    `email`              VARCHAR(100) NULL,
    `phone`              VARCHAR(20) NULL,
    `age`                INTEGER NULL,
    `occupation`         VARCHAR(100) NULL,
    `registered_address` TEXT NULL,
    `mailing_address`    TEXT NULL,
    `remark`             TEXT NULL,
    `rating`             ENUM('S', 'A', 'B', 'C', 'D') NULL,
    `project_id`         INTEGER      NOT NULL,
    `created_at`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sales_id`           VARCHAR(50) NULL,

    INDEX                `idx_house_no`(`house_no`),
    INDEX                `purchased_customer_project_id_fkey`(`project_id`),
    INDEX                `idx_sales_person`(`sales_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_questionnaire`
(
    `id`                   INTEGER NOT NULL AUTO_INCREMENT,
    `questionnaire_date`   DATE    NOT NULL,
    `name`                 VARCHAR(100) NULL,
    `age`                  INTEGER NULL,
    `gender`               ENUM('男', '女', '不透露') NULL,
    `landline`             VARCHAR(20) NULL,
    `phone`                VARCHAR(20) NULL,
    `email`                VARCHAR(100) NULL,
    `occupation`           VARCHAR(100) NULL,
    `receptionist_id`      VARCHAR(50) NULL,
    `visited_house`        VARCHAR(100) NULL,
    `purchase_timeline`    ENUM('半年內', '一年內', '其他') NULL,
    `demand_type`          ENUM('結構體', '成屋', '預售屋') NULL,
    `ideal_area`           ENUM('21坪以下', '21-30坪', '31-40坪', '41-50坪', '51坪以上', '其他') NULL,
    `room_demand`          ENUM('二房', '三房', '四房', '店面', '其他') NULL,
    `budget_range`         VARCHAR(100) NULL,
    `considerations`       TEXT NULL,
    `satisfaction_factors` TEXT NULL,
    `residence_area`       VARCHAR(100) NULL,
    `purchase_motive`      ENUM('首購', '換屋', '投資置產', '為子女購屋', '其他') NULL,
    `info_sources`         TEXT NULL,
    `rating`               ENUM('S', 'A', 'B', 'C', 'D') NULL,
    `project_id`           INTEGER NOT NULL,
    `created_at`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX                  `idx_receptionist`(`receptionist_id`),
    INDEX                  `visitor_questionnaire_project_id_fkey`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `withdrawal_record`
(
    `id`                INTEGER        NOT NULL AUTO_INCREMENT,
    `customer_name`     VARCHAR(255)   NOT NULL,
    `building`          VARCHAR(10)    NOT NULL,
    `floor`             INTEGER        NOT NULL,
    `unit`              VARCHAR(10)    NOT NULL,
    `withdrawal_status` ENUM('已申請', '處理中', '已完成', '已取消') NOT NULL,
    `withdrawal_reason` VARCHAR(100)   NOT NULL,
    `withdrawal_date`   DATETIME(3) NOT NULL,
    `house_price`       DECIMAL(15, 2) NOT NULL,
    `unit_price`        DECIMAL(15, 2) NOT NULL,
    `parking_price`     DECIMAL(15, 2) NOT NULL,
    `total_price`       DECIMAL(15, 2) NOT NULL,
    `remark`            TEXT NULL,
    `project_id`        INTEGER        NOT NULL,
    `created_at`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX               `idx_project`(`project_id`),
    INDEX               `idx_status`(`withdrawal_status`),
    INDEX               `idx_date`(`withdrawal_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_plan`
(
    `id`             INTEGER        NOT NULL AUTO_INCREMENT,
    `category`       VARCHAR(100)   NOT NULL,
    `item`           VARCHAR(100) NULL,
    `budget`         DECIMAL(15, 2) NOT NULL,
    `actual_expense` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `quantity`       INTEGER        NOT NULL DEFAULT 1,
    `unit`           VARCHAR(20) NULL,
    `unit_price`     DECIMAL(15, 2) NULL,
    `vendor`         VARCHAR(100) NULL,
    `execution_rate` DECIMAL(10, 2) NULL,
    `remark`         TEXT NULL,
    `project_id`     INTEGER        NOT NULL,
    `created_at`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX            `budget_plan_project_id_fkey`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_management`
(
    `id`             INTEGER        NOT NULL AUTO_INCREMENT,
    `expense_date`   DATE           NOT NULL,
    `category`       VARCHAR(100)   NOT NULL,
    `item`           VARCHAR(100) NULL,
    `actual_expense` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `quantity`       INTEGER        NOT NULL DEFAULT 1,
    `unit`           VARCHAR(20) NULL,
    `unit_price`     DECIMAL(15, 2) NULL,
    `vendor`         VARCHAR(100) NULL,
    `invoice_no`     VARCHAR(50) NULL,
    `remark`         TEXT NULL,
    `project_id`     INTEGER        NOT NULL,
    `created_at`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX            `expense_management_project_id_fkey`(`project_id`),
    INDEX            `idx_category`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_list`
(
    `id`                    INTEGER        NOT NULL AUTO_INCREMENT,
    `building`              VARCHAR(10)    NOT NULL,
    `area`                  DECIMAL(10, 2) NULL,
    `floor`                 INTEGER        NOT NULL,
    `unit`                  VARCHAR(10)    NOT NULL,
    `status`                ENUM('售出', '訂金') NOT NULL,
    `sales_date`            DATE NULL,
    `total_price`           DECIMAL(15, 2) NULL,
    `total_commission_rate` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_commission`      DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `house_no`              VARCHAR(50) NULL,
    `project_id`            INTEGER        NOT NULL,
    `created_at`            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sales_id`              VARCHAR(50)    NOT NULL,

    INDEX                   `commission_list_sales_id_idx`(`sales_id`),
    INDEX                   `commission_list_project_id_fkey`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_details`
(
    `id`            INTEGER        NOT NULL AUTO_INCREMENT,
    `commission_id` INTEGER        NOT NULL,
    `commission_no` INTEGER        NOT NULL,
    `rate`          DECIMAL(10, 2) NOT NULL,
    `status`        ENUM('已請傭', '未請傭') NOT NULL DEFAULT '未請傭',
    `amount`        DECIMAL(15, 2) NOT NULL,
    `remark`        TEXT NULL,
    `created_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX           `commission_details_commission_id_idx`(`commission_id`),
    UNIQUE INDEX `uk_commission_no`(`commission_id`, `commission_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deposit_management`
(
    `id`             INTEGER        NOT NULL AUTO_INCREMENT,
    `buyer`          VARCHAR(100)   NOT NULL,
    `amount`         DECIMAL(15, 2) NOT NULL,
    `payment_status` ENUM('已結清', '部分付款', '未付款', '逾期') NOT NULL DEFAULT '未付款',
    `payment_date`   DATE NULL,
    `due_date`       DATE           NOT NULL,
    `auto_remind`    BOOLEAN        NOT NULL DEFAULT true,
    `remark`         TEXT NULL,
    `house_no`       VARCHAR(50) NULL,
    `project_id`     INTEGER        NOT NULL,
    `created_at`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX            `deposit_management_project_id_fkey`(`project_id`),
    INDEX            `idx_house_no`(`house_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `handover_management`
(
    `id`               INTEGER      NOT NULL AUTO_INCREMENT,
    `buyer`            VARCHAR(100) NOT NULL,
    `house_no`         VARCHAR(50)  NOT NULL,
    `handover_date`    DATE NULL,
    `remark`           TEXT NULL,
    `project_id`       INTEGER      NOT NULL,
    `created_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completion_items` TEXT NULL,
    `defect_items`     TEXT NULL,
    `scheduled_date`   DATE NULL,
    `status`           ENUM('待點交', '點交中', '已完成', '延期') NOT NULL DEFAULT '待點交',

    INDEX              `handover_management_house_no_idx`(`house_no`),
    INDEX              `handover_management_project_id_fkey`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sales_control`
    ADD CONSTRAINT `sales_control_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_control`
    ADD CONSTRAINT `sales_control_sales_id_fkey` FOREIGN KEY (`sales_id`) REFERENCES `sales_personnel` (`employee_no`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parking_space`
    ADD CONSTRAINT `parking_space_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_appointment`
    ADD CONSTRAINT `customer_appointment_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_appointment`
    ADD CONSTRAINT `customer_appointment_sales_id_fkey` FOREIGN KEY (`sales_id`) REFERENCES `sales_personnel` (`employee_no`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchased_customer`
    ADD CONSTRAINT `purchased_customer_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchased_customer`
    ADD CONSTRAINT `purchased_customer_sales_id_fkey` FOREIGN KEY (`sales_id`) REFERENCES `sales_personnel` (`employee_no`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitor_questionnaire`
    ADD CONSTRAINT `visitor_questionnaire_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdrawal_record`
    ADD CONSTRAINT `withdrawal_record_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_plan`
    ADD CONSTRAINT `budget_plan_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_management`
    ADD CONSTRAINT `expense_management_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_list`
    ADD CONSTRAINT `commission_list_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_list`
    ADD CONSTRAINT `commission_list_sales_id_fkey` FOREIGN KEY (`sales_id`) REFERENCES `sales_personnel` (`employee_no`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_details`
    ADD CONSTRAINT `commission_details_commission_id_fkey` FOREIGN KEY (`commission_id`) REFERENCES `commission_list` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deposit_management`
    ADD CONSTRAINT `deposit_management_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `handover_management`
    ADD CONSTRAINT `handover_management_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
