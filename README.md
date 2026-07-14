# 芜湖市鸠江区沈巷镇水利泵站信息管理系统

一个用于展示和管理水利泵站信息的 Web 应用，基于 Vue 3 + TypeScript 构建。

## 功能特性

- **泵站信息展示** - 展示辖区内各泵站的详细信息，包括设备参数、地理位置、工程规模等
- **照片管理** - 展示泵站相关照片，支持分类查看
- **通知公告** - 发布和管理水利相关通知公告文章
- **后台管理** - 完整的后台管理系统，支持内容管理和数据维护
- **响应式设计** - 适配桌面和移动设备

## 技术栈

- **前端框架**: Vue 3.5 + TypeScript
- **构建工具**: Vite 8
- **状态管理**: Pinia 3
- **路由**: Vue Router 5
- **CSS 框架**: TailwindCSS 4 + @tailwindcss/typography
- **HTTP 客户端**: Axios
- **Markdown 渲染**: markdown-it
- **日期处理**: Day.js

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── Header.vue       # 页头导航
│   └── Footer.vue       # 页脚
├── pages/               # 页面组件
│   ├── Home/            # 首页
│   │   ├── Index.vue    # 首页主组件
│   │   ├── Features.vue # 功能特点展示
│   │   ├── News_summary.vue    # 新闻摘要
│   │   ├── Station_info.vue    # 泵站信息
│   │   └── Station_picture.vue # 泵站图片
│   ├── About/           # 关于我们
│   │   ├── Index.vue    # 关于页面主组件
│   │   ├── Section_1.vue ~ Section_4.vue  # 各段落内容
│   ├── Station/         # 泵站详情
│   │   └── Index.vue    # 泵站详情页
│   ├── Article/         # 文章模块
│   │   ├── List.vue     # 文章列表
│   │   └── Detail.vue   # 文章详情
│   ├── Admin/           # 后台管理
│   │   ├── Layout.vue   # 后台布局
│   │   ├── Overview.vue # 后台概览
│   │   ├── ArticleList.vue    # 文章管理
│   │   ├── CategoryEdit.vue   # 分类管理
│   │   ├── Photo.vue    # 照片管理
│   │   └── components/  # 后台专用组件
│   ├── Login.vue        # 登录页
│   └── NotFound.vue     # 404 页面
├── store/               # Pinia 状态管理
│   ├── station.ts       # 泵站数据
│   ├── article.ts       # 文章数据
│   ├── category.ts      # 分类数据
│   └── user.ts          # 用户状态
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数
│   └── apiService.ts    # API 请求封装
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
| `/home` | 首页 | 系统首页，展示泵站概况 |
| `/about` | 关于我们 | 泵站介绍和相关说明 |
| `/station` | 泵站信息 | 泵站详情展示 |
| `/list` | 通知公告 | 文章列表页 |
| `/detail/:slug` | 文章详情 | 单篇文章详情 |
| `/login` | 登录 | 管理员登录 |
| `/admin/*` | 后台管理 | 需要登录权限 |

## 后台管理

后台管理模块需要登录后才能访问，包含以下功能：

- **后台概览** - 系统数据统计和快速入口
- **分类管理** - 管理文章分类
- **新闻列表** - 发布和管理通知公告
- **照片管理** - 上传和管理泵站照片

## 数据说明

泵站数据包含以下信息：

- 基本信息：站名、位置、建成年份、所在流域
- 工程参数：装机数量、设计排涝流量、总容量
- 设备信息：变压器型号、电机型号、水泵型号
- 建筑信息：主厂房类型及面积、管理房类型及面积
- 关联图片：泵站远景、主厂房、控制柜、进水闸、出水闸等
