# 芜湖市鸠江区沈巷镇水利泵站信息管理系统

一个用于展示和管理水利泵站信息的 Web 应用，基于 Vue 3 + TypeScript 构建。

## 功能特性

- **泵站信息展示** - 展示辖区内各泵站的详细信息，包括设备参数、地理位置、工程规模等
- **新闻资讯** - 按分类（泵站动态/区级通知/人事通知/财务通知等，分类可在后台维护）展示文章列表与详情
- **文章封面** - 列表卡片与首页轮播以完整高度展示（适配红头文件等竖版公文，宽度按比例收窄，浅灰衬底）
- **文章详情** - 支持 Markdown 渲染，带 XSS 安全防护与匿名点赞；正文内相对路径图片/附件自动补全前缀
- **个人主页** - 按作者聚合文章与阅读统计
- **后台管理** - 登录鉴权（JWT）、数据概览、文章管理（回收站/批量分类/推荐）、分类管理（两级树）、照片/文档上传管理；照片与文档支持一键复制 slug 与 Markdown 片段（HTTP 局域网下也可一键复制，无弹窗）
- **PC 多分辨率适配** - 针对 1024×768、1366×768、1920×1080 等桌面分辨率统一布局体验（不做移动端专项适配）

## 技术栈

- **前端框架**: Vue 3.5 + TypeScript
- **构建工具**: Vite 8
- **状态管理**: Pinia 3
- **路由**: Vue Router 5
- **CSS 框架**: TailwindCSS 4 + daisyUI 5 + @tailwindcss/typography
- **HTTP 客户端**: Axios
- **Markdown 渲染**: markdown-it + DOMPurify（XSS 防护）
- **轮播**: Splide
- **日期处理**: Day.js

## 项目结构

```
src/
├── common/               # 公共组件
│   ├── Header.vue        # 前台页头导航
│   └── Footer.vue        # 前台页脚
├── components/           # 通用组件
│   ├── AppModal.vue      # 弹窗
│   ├── AppPagination.vue # 分页
│   ├── ArticleCover.vue  # 文章封面（contain 展示 + 灰底衬托）
│   ├── CopyButton.vue    # 一键复制按钮（slug / Markdown）
│   └── TitleComponent.vue
├── pages/
│   ├── Home/             # 首页（动态轮播、分类资讯、泵站信息/风光、特色）
│   ├── About/            # 关于我们（机构职能、管理团队）
│   ├── Station/          # 泵站详情（数据为前端内置 store/station.ts）
│   ├── Article/          # 文章列表（分类侧栏+分页）/ 详情（Markdown）
│   ├── Profile/          # 作者个人页
│   ├── Admin/            # 后台（登录/概览/文章/分类/照片/文档）
│   └── NotFound.vue      # 404
├── store/                # Pinia：base（分类/用户）、article、station、auth
├── utils/                # request、apiService、baseInfo、category、clipboard、formatters
├── MainLayout.vue        # 前台主布局
└── router.ts             # 路由与后台鉴权守卫
```

## 快速开始

### 环境要求

- Node.js ^20.19.0 或 >=22.12.0（或 Bun）
- 需要能访问后端服务（本地开发默认经 vite 代理，见下）

### 安装依赖

```bash
npm install   # 或 bun install
```

### 开发服务器

```bash
npm run dev   # 或 bun run dev
```

启动后访问 http://localhost:5173；开发服务默认监听 `0.0.0.0`，局域网设备可用本机 IP 访问（终端会打印 Network 地址，如 `http://192.168.x.x:5173`）。

开发环境 API 经 vite 代理转发：`/api/*` → `http://100.123.19.58:8088/*`（见 `vite.config.ts`；后端地址变更时同步修改 `server.proxy.target`）。

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
| `/home` | 首页 | 泵站概况、动态轮播与分类资讯 |
| `/about` | 关于我们 | 机构职能与管理团队 |
| `/station?index=:i` | 泵站详情 | 按序号展示内置泵站数据 |
| `/article/list?category=:id&page=:n` | 文章列表 | 按二级分类筛选，支持分页 |
| `/article/detail/:slug` | 文章详情 | Markdown 渲染 + 点赞 |
| `/profile/:id` | 个人主页 | 作者文章列表与统计 |
| `/admin/login` | 后台登录 | JWT 登录 |
| `/admin/overview` 等 | 后台管理 | 概览/文章/分类/照片/文档（顶栏统一显示页名） |
| `*` | 404 | 页面未找到 |

## 环境配置

- API 与资源统一走 `/api/` 前缀（`src/utils/baseInfo.ts`）：
  - 接口：`/api/` + 路径（如 `/api/articles/`）
  - 图片：`/api/image/<slug>`
  - 文档：`/api/document/<slug>`
- 开发环境由 vite 代理转发到后端（`vite.config.ts` 的 `server.proxy`）；生产环境由部署层（nginx 等）将 `/api/` 反向代理到后端。

### 正文 Markdown 约定

详情页渲染时会对相对路径自动补全前缀，后台「复制 md」生成的片段可直接粘贴进正文：

| 类型 | 粘贴格式 | 渲染结果 |
|------|----------|----------|
| 图片 | `![原文件名](slug)` | `/api/image/slug` |
| 附件 | `[原文件名](slug)` | `/api/document/slug` |

`http(s)://` 开头的绝对地址保持原样，不会被改写。

## 数据说明

### 泵站数据

泵站数据为前端内置（`src/store/station.ts`，暂无后端接口），包含：

- **基本信息**: 站名、位置、建成年份、所在流域/水系/圩口
- **工程参数**: 装机数量、设计排涝扬程/水位、排涝最高出水位
- **设备信息**: 变压器、电机、水泵型号
- **建筑信息**: 主厂房/管理房类型面积、压力箱参数
- **关联图片**: 泵站远景、主厂房、控制柜、进/出水闸等

### 文章分类

分类存储在后端，后台可维护（严格两级：文章只挂二级分类）。首页栏目与导航按**分类名称**
匹配（见 `src/utils/categoryConfig.ts`），名称未命中时对应栏目为空——重命名分类时请同步
调整该配置。

### 文章封面

封面多为红头文件扫描件（竖版）。前台统一使用 `ArticleCover`：

- `object-contain`：高度撑满容器、完整展示（含红头），宽度按比例收窄
- 衬底 `bg-base-300`：两侧/上下留白不突兀
- 覆盖场景：首页新闻轮播、文章列表卡片

## 安全特性

- **XSS 防护**: Markdown 渲染使用 DOMPurify 进行 HTML 消毒
- **HTML 禁用**: markdown-it 配置 `html: false`，阻止原始 HTML 注入
- **鉴权**: 后台写接口需 JWT（`Authorization: Bearer`）；401 自动清理本地 token 并跳转登录页

## 开发规范

### 代码组织

- 组件使用 `<script setup lang="ts">` 语法
- 状态管理使用 Pinia Composition API
- 页面主容器统一使用 `page-container` 工具类（`src/style.css`），**不要写死 `w-7xl` 等固定宽度**，避免低分辨率下横向溢出
- 后台页面标题只保留顶栏（`route.meta.title`），内容区不要再写同名 `h2`

### 命名规范

- 组件文件: PascalCase（如 `ArticleCover.vue`）
- Store / 工具文件: camelCase（如 `article.ts`、`clipboard.ts`）
- 工具函数: camelCase（如 `date_text`、`copy_text`）

## License

MIT
