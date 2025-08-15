@echo off
chcp 65001 >nul

echo 🚀 开始运行权限管理API单元测试...

REM 检查是否安装了依赖
if not exist "node_modules" (
    echo 📦 安装依赖...
    npm install
)

REM 运行所有测试
echo 🧪 运行所有测试...
npm test

REM 检查测试结果
if %errorlevel% equ 0 (
    echo ✅ 所有测试通过！
    
    REM 生成覆盖率报告
    echo 📊 生成测试覆盖率报告...
    npm run test:coverage
    
    echo 🎉 测试完成！
) else (
    echo ❌ 测试失败，请检查错误信息
    exit /b 1
)

pause
