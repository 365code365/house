#!/bin/bash

# 权限管理API测试运行脚本

echo "🚀 开始运行权限管理API单元测试..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 运行所有测试
echo "🧪 运行所有测试..."
npm test

# 检查测试结果
if [ $? -eq 0 ]; then
    echo "✅ 所有测试通过！"
    
    # 生成覆盖率报告
    echo "📊 生成测试覆盖率报告..."
    npm run test:coverage
    
    echo "🎉 测试完成！"
else
    echo "❌ 测试失败，请检查错误信息"
    exit 1
fi
