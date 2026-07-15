# 芜湖市鸠江区沈巷镇水利泵站信息管理系统

一个用于展示和管理水利泵站信息的 Web 应用，基于 Vue 3 + TypeScript 构建。

## 功能特性

- **泵站信息展示** - 展示辖区内各泵站的详细信息，包括设备参数、地理位置、工程规模等
- **新闻资讯** - 发布和管理水利相关通知公告、会议公开、财务信息等分类文章
- **文章详情** - 支持 Markdown 渲染，带 XSS 安全防护
- **响应式设计** - 适配桌面和移动设备

## 技术栈

- **前端框架**: Vue 3.5 + TypeScript 6
- **构建工具**: Vite 8
- **状态管理**: Pinia 3
- **路由**: Vue Router 5
- **CSS 框架**: TailwindCSS 4 + @tailwindcss/typography
- **HTTP 客户端**: Axios
- **Markdown 渲染**: markdown-it + DOMPurify（XSS 防护）
- **日期处理**: Day.js

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── Header.vue       # 页头导航
│   └── Footer.vue       # 页脚
├── pages/               # 页面组件
│   ├── Home/            # 首页
│   │   ├── Index.vue           # 首页主组件
│   │   ├── Features.vue        # 功能特点展示
│   │   ├── News_summary.vue    # 推荐文章摘要
│   │   ├── Category_news.vue   # 分类资讯（通知/会议/财务）
│   │   ├── Station_info.vue    # 泵站信息
│   │   └── Station_picture.vue # 泵站图片
│   ├── About/           # 关于我们
│   ├── Station/         # 泵站详情
│   ├── Article/         # 文章模块
│   │   ├── List.vue     # 文章列表（支持分类筛选）
│   │   └── Detail.vue   # 文章详情（Markdown 渲染）
│   └── NotFound.vue     # 404 页面
├── store/               # Pinia 状态管理
│   ├── station.ts       # 泵站数据
│   ├── article.ts       # 文章数据
│   ├── category.ts      # 分类数据
│   └── user.ts          # 用户状态
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数
│   ├── request.ts       # Axios 实例封装
│   ├── apiService.ts    # API 请求封装
│   ├── baseInfo.ts      # 环境配置（API/图片地址）
│   └── formatters.ts    # 公共格式化函数
├── router.ts            # 路由配置
├── MainLayout.vue       # 主布局组件
├── App.vue              # 根组件
└── main.ts              # 入口文件
```

## 快速开始

### 环境要求

- Node.js ^20.19.0 或 >=22.12.0
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
```

### 开发服务器

```bash
npm run dev
```

启动后访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 重定向到 `/home` |
| `/home` | 首页 | 系统首页，展示泵站概况和推荐文章 |
| `/about` | 关于我们 | 水利站介绍 |
| `/station` | 泵站信息 | 泵站详情展示 |
| `/list?category=:id` | 文章列表 | 按分类筛选文章 |
| `/detail/:slug` | 文章详情 | Markdown 渲染的文章详情 |
| `*` | 404 | 页面未找到 |

## 环境配置

API 和图片地址在 `src/utils/baseInfo.ts` 中配置：

```typescript
const dev_api_url = 'http://100.68.9.83:8088/'   // 开发环境 API
const dist_api_url = '/api/'                       // 生产环境 API
const dev_pic_url = 'http://100.68.9.83:8666/'    // 开发环境图片
const dist_pic_url = '/pic/'                       // 生产环境图片
```

## 数据说明

### 泵站数据

泵站数据包含以下信息：

- **基本信息**: 站名、位置、建成年份、所在流域、所在水系、所在圩口
- **工程参数**: 装机数量、设计排涝扬程、设计排涝水位、排涝最高出水位
- **设备信息**: 变压器型号、电机型号、水泵型号
- **建筑信息**: 主厂房类型及面积、管理房类型及面积、压力箱长度及口径
- **关联图片**: 泵站远景、主厂房、控制柜、进水闸、出水闸等

### 文章分类

- 通知公告（category_id: 2）
- 会议公开（category_id: 4）
- 财务信息（category_id: 5）

## 安全特性

- **XSS 防护**: Markdown 渲染使用 DOMPurify 进行 HTML 消毒
- **HTML 禁用**: markdown-it 配置 `html: false`，阻止原始 HTML 注入

## 开发规范

### 代码组织

- 组件使用 `<script setup lang="ts">` 语法
- 状态管理使用 Pinia Composition API
- 公共函数提取到 `src/utils/` 目录

### 命名规范

- 组件文件: PascalCase（如 `News_summary.vue`）
- Store 文件: camelCase（如 `article.ts`）
- 工具函数: camelCase（如 `date_text`）

## License

MIT
