# OmniLearn - 探索万物，图解一切

一个交互式在线学习平台，带你探索计算机科学的奥秘。

## 特性

- 🎓 交互式课程 - 从零开始学 Python
- 💻 代码练习场 - 边学边练
- 🎨 玻璃拟态 UI - 现代暗色主题
- 📊 学习进度跟踪
- ⚙️ Runtime 引擎 - JSON Schema 驱动课件播放
- 🧩 Builder 导出 - 一键发布 Runtime 课件
- 🕒 课时版本化 - 自动记录课时内容版本

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
# 启动前端
npm run dev

# 启动后端 (另一个终端)
cd server
npx tsx src/index.ts
```

### 访问

- 前端: http://localhost:3000
- 后端: http://localhost:3001

### 可选环境变量

创建 `.env`（前端）可覆盖 API 地址：

```bash
VITE_API_BASE_URL=http://localhost:3001/api
```

### Runtime 示例

登录后在“推荐探索”中打开 `数据驱动课件（JSON）`，可体验基于 Lesson Schema 的播放器。

## Builder Runtime 发布

在构建器右侧操作区点击 `发布 Runtime 课件`，系统会：

1. 把当前画布转换为 `Lesson Schema v1`
2. 自动创建课程与 `runtime` 课时
3. 写入 `lesson_versions` 版本表（version 从 1 开始）
4. 后续再次发布会更新同一 Runtime 课时并自动递增版本
5. 在 Builder 左侧操作区可刷新版本列表并执行回滚
6. 每次发布可填写版本说明（change note）
7. 支持将任一 Runtime 历史版本“应用到画布”继续编辑
8. 支持导入本地 Runtime JSON 到 Builder 继续编辑
9. 支持版本差异摘要（对比上一版：节点/变量/时间轴）
10. 支持 AI 一键生成 Runtime 动态课件（主题 + 风格 + 复杂度）
11. 支持 AI 按自然语言迭代修改当前画布（refine runtime schema）

### 登录

- 邮箱: demo@omnilearn.app
- 密码: password123

## 技术栈

- React + TypeScript
- Vite
- SQLite
- Express
- Tailwind CSS
- Motion (动画)

## License

MIT
