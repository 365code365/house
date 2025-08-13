# 安全配置指南

本文檔提供房地產銷控管理系統的安全配置最佳實踐。

## 🔐 環境變量安全

### 密鑰管理

1. **JWT 密鑰**
   - 使用至少32字符的強隨機密鑰
   - 定期輪換密鑰（建議每3-6個月）
   - 不要在代碼中硬編碼密鑰

2. **數據庫密碼**
   - 使用強密碼（至少12字符，包含大小寫字母、數字、特殊字符）
   - 為生產環境創建專用數據庫用戶
   - 限制數據庫用戶權限（僅授予必要的權限）

3. **CSRF 保護**
   - 設置強隨機 CSRF 密鑰
   - 在所有表單中啟用 CSRF 保護

### 環境變量存儲

```bash
# 生成強隨機密鑰的方法
# JWT 密鑰
openssl rand -base64 32

# CSRF 密鑰
openssl rand -hex 32
```

## 🌐 網絡安全

### CORS 配置

```javascript
// 生產環境 CORS 設置
CORS_ORIGIN=https://yourdomain.com

// 開發環境可以使用
CORS_ORIGIN=http://localhost:3000
```

### HTTPS 配置

1. **SSL/TLS 證書**
   - 使用有效的 SSL 證書
   - 配置 HSTS (HTTP Strict Transport Security)
   - 禁用不安全的 TLS 版本

2. **安全標頭**
   ```javascript
   // next.config.js 中的安全標頭
   headers: [
     {
       key: 'X-Frame-Options',
       value: 'DENY'
     },
     {
       key: 'X-Content-Type-Options',
       value: 'nosniff'
     },
     {
       key: 'Referrer-Policy',
       value: 'origin-when-cross-origin'
     }
   ]
   ```

## 🗄️ 數據庫安全

### 連接安全

1. **網絡隔離**
   - 數據庫服務器不應直接暴露在公網
   - 使用 VPN 或私有網絡連接
   - 配置防火牆規則

2. **用戶權限**
   ```sql
   -- 創建專用應用用戶
   CREATE USER 'app_user'@'%' IDENTIFIED BY 'strong_password';
   
   -- 僅授予必要權限
   GRANT SELECT, INSERT, UPDATE, DELETE ON real_estate_prod.* TO 'app_user'@'%';
   
   -- 不要授予 DROP, CREATE, ALTER 等管理權限
   ```

3. **數據加密**
   - 啟用數據庫連接加密 (SSL)
   - 對敏感數據進行應用層加密
   - 定期備份並加密備份文件

## 📁 文件上傳安全

### 文件類型限制

```env
# 限制允許的文件類型
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf

# 限制文件大小 (5MB)
UPLOAD_MAX_SIZE=5242880
```

### 文件存儲

1. **存儲位置**
   - 不要將上傳文件存儲在 web 根目錄
   - 使用專用的文件存儲服務
   - 對文件名進行清理和重命名

2. **文件掃描**
   - 實施病毒掃描
   - 驗證文件內容與擴展名匹配
   - 限制可執行文件上傳

## 🔍 日誌和監控

### 日誌配置

```env
# 生產環境日誌級別
LOG_LEVEL=error

# 安全的日誌文件路徑
LOG_FILE_PATH=/var/log/app/production.log
```

### 安全事件監控

1. **登錄監控**
   - 記錄所有登錄嘗試
   - 監控異常登錄模式
   - 實施賬戶鎖定機制

2. **API 監控**
   - 監控 API 調用頻率
   - 檢測異常請求模式
   - 實施速率限制

## 🚀 部署安全

### 環境隔離

1. **環境分離**
   - 開發、測試、生產環境完全分離
   - 不同環境使用不同的數據庫和密鑰
   - 限制生產環境訪問權限

2. **容器安全**
   ```dockerfile
   # 使用非 root 用戶運行應用
   USER node
   
   # 最小化容器權限
   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nextjs -u 1001
   ```

### 更新和補丁

1. **依賴管理**
   ```bash
   # 定期檢查安全漏洞
   npm audit
   
   # 更新有漏洞的依賴
   npm audit fix
   ```

2. **系統更新**
   - 定期更新操作系統
   - 及時應用安全補丁
   - 監控安全公告

## ✅ 安全檢查清單

### 部署前檢查

- [ ] 所有環境變量已正確配置
- [ ] 使用強密碼和密鑰
- [ ] HTTPS 已啟用
- [ ] 數據庫連接已加密
- [ ] 文件上傳限制已配置
- [ ] 安全標頭已設置
- [ ] 日誌記錄已啟用
- [ ] 備份策略已實施

### 定期檢查

- [ ] 檢查依賴漏洞
- [ ] 審查訪問日誌
- [ ] 測試備份恢復
- [ ] 更新密鑰和證書
- [ ] 檢查用戶權限
- [ ] 監控系統性能

## 🆘 安全事件響應

### 事件類型

1. **數據洩露**
   - 立即隔離受影響系統
   - 通知相關用戶
   - 調查洩露範圍
   - 實施修復措施

2. **未授權訪問**
   - 重置相關密碼
   - 撤銷訪問權限
   - 審查訪問日誌
   - 加強監控

### 聯繫信息

```env
# 安全事件聯繫方式
SECURITY_EMAIL=security@yourdomain.com
EMERGENCY_CONTACT=+1234567890
```

---

**重要提醒**: 安全是一個持續的過程，需要定期評估和改進。請確保團隊成員都了解這些安全最佳實踐。