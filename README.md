# 芜湖市鸠江区沈巷镇水利泵站信息管理系统

一个用于展示和管理水利泵站信息的 Web 应用，基于 Vue 3 + TypeScript 构建。

## 功能特性

- **泵站信息展示** - 展示辖区内各泵站的详细信息，包括设备参数、地理位置、工程规模等
- **新闻资讯** - 按分类（泵站动态/区级通知/人事通知/财务通知等，分类可在后台维护）展示文章列表与详情
- **文章封面** - 列表卡片与首页轮播以完整高度展示（适配红头文件等竖版公文，宽度按比例收窄，浅灰衬底）
- **文章详情** - 支持 Markdown 渲染，带 XSS 安全防护与匿名点赞；正文内相对路径图片/附件自动补全前缀
- **个人主页** - 按作者聚合文章与阅读统计
- **后台管理** - 登录鉴权（JWT）、修改密码、数据概览、文章管理（回收站/批量分类/推荐/按作者筛选）、分类管理（两级树，仅超管）、账户管理（仅超管）、照片/文档上传管理；照片与文档均支持**多文件批量上传**（一次最多 20 个，单次请求整批生效）、**上传进度条（含「服务器处理中」阶段）**、**随时取消上传**、**改名/删除**（上传者本人或超管）与一键复制 Markdown 片段（HTTP 局域网下也可一键复制，无弹窗）
- **上传限制** - 图片单张 ≤ 10MB、文档单个 ≤ 50MB、单次最多 20 个（与后端 `MAX_IMAGE_SIZE_MB` / `MAX_DOCUMENT_SIZE_MB` / `MAX_BATCH_FILES` 一致）；选择文件后立即用 `file.size` 预检并提示超限文件与当前体积，避免大文件白传
- **角色权限差异** - 超级管理员可查看/编辑全站文章、指定发布主体与发布时间、管理分类与批量分类、创建/删除账户并重置密码；普通账号后台仅显示并管理本人文章，分类字段只读、分类管理与账户管理入口不可见（详见「账户与权限」）
- **公开数据不受登录态影响** - 前台文章列表/详情、首页栏目、作者主页均以匿名身份读取，普通账号登录后台后浏览前台仍可看到全站公开文章
- **统一错误提示** - 各接口失败时解析后端 `detail` 并展示可读原因（如「原密码错误」「无权修改他人文章」「仅超级管理员可管理文章分类」）；非 JSON 错误响应（网关 HTML 413/502）按 HTTP 状态码兜底，超时/断网/取消均有明确文案，不再出现「失败但无提示」
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
│   ├── ArticleCover.vue  # 文章封面（contain 展示 + 灰底衬托 + 懒加载）
│   ├── CopyButton.vue    # 一键复制按钮（slug / Markdown）
│   ├── PageLoading.vue   # 路由 Suspense fallback
│   └── TitleComponent.vue
├── composables/          # 组合式函数
│   ├── usePermissions.ts # 角色权限统一判定（超管/普通账号能力边界）
│   └── useUpload.ts      # 上传进度/阶段/取消/错误处理（照片与文档共用）
├── pages/
│   ├── Home/             # 首页（动态轮播、分类资讯、泵站信息/风光、特色）
│   ├── About/            # 关于我们（机构职能、管理团队）
│   ├── Station/          # 泵站详情（数据为前端内置 store/station.ts）
│   ├── Article/          # 文章列表（分类侧栏+分页）/ 详情（Markdown）
│   ├── Profile/          # 作者个人页
│   ├── Admin/            # 后台（登录/修改密码/概览/文章/分类/账户/照片/文档）
│   └── NotFound.vue      # 404
├── store/                # Pinia：base（分类/用户）、article、station、auth
├── types/                # 全局类型增强（axios.skip_auth、路由 meta）
├── utils/                # request、apiService、apiError（detail 统一解析）、upload（大小/格式预检）、baseInfo、category、clipboard、formatters
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

启动后访问 http://localhost:5173；开发服务监听 `0.0.0.0`，局域网设备可用本机 IP 访问（终端会打印 Network 地址，如 `http://192.168.x.x:5173`）。

开发环境 API 经 vite 代理转发：`/api/*` → `http://100.123.19.58:8088/*`（见 `vite.config.ts`；后端地址变更时同步修改 `server.proxy.target`）。如需跳过代理直连后端，可设置环境变量 `VITE_API_BASE`（如 `VITE_API_BASE=http://100.123.19.58:8088/`），接口/图片/文档前缀会统一跟随。

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
| `/admin/password` | 修改密码 | 新密码至少 6 位，成功后引导重新登录 |
| `/admin/overview` 等 | 后台管理 | 概览/文章/照片/文档（顶栏统一显示页名） |
| `/admin/category` | 分类管理 | **仅超级管理员**；普通账号访问会被重定向到概览并提示 |
| `/admin/users` | 账户管理 | **仅超级管理员**；创建/删除普通账户、重置密码（缺省 `abc123`） |
| `*` | 404 | 页面未找到 |

## 环境配置

- API 与资源统一走 `/api/` 前缀（`src/utils/baseInfo.ts`）：
  - 接口：`/api/` + 路径（如 `/api/articles/`）
  - 图片：`/api/image/<slug>`
  - 文档：`/api/document/<slug>`
- 开发环境由 vite 代理转发到后端（`vite.config.ts` 的 `server.proxy`）；生产环境由部署层（nginx 等）将 `/api/` 反向代理到后端。

### 后端接口约定

后端为 FastAPI 服务，联调时可直接访问其 `/docs`（Swagger）查看接口字段与示例；前端各接口封装见 `src/store`、`src/utils/apiService.ts`。接口字段、错误与权限约定以本节及下方各章节为准：

- 集合路径**必须带尾斜杠**（`/articles/`、`/image/` 等），否则 307
- 分页参数 `page` / `page_size`，响应统一为 `{ data, total, page, page_size, has_next }`
- 错误响应统一为 `detail`：400/401/403/404/500 为字符串，422 为数组（取 `detail[0].msg`）
- 鉴权使用 `Authorization: Bearer <token>`；`is_superuser` 区分超级管理员与普通用户（权限边界见「账户与权限」）
- 上传接口为 `multipart/form-data`：单文件字段名 `file`，批量接口 `POST /image/batch/`、
  `POST /document/batch/` 字段名 `files`（同名重复出现），单次最多 20 个、整批原子；
  图片 ≤ 10MB、文档 ≤ 50MB

### 上传限制与失败提示

限制同时在前端与后端各校验一次（前端预检见 `src/utils/upload.ts`，后端见 `app/settings.py`）：

| 项目 | 限制 | 前端行为 |
|------|------|----------|
| 图片单张 | 10MB（`MAX_IMAGE_SIZE_MB`） | 选择后 `file.size` 预检，超限提示文件名与当前体积，不发请求 |
| 文档单个 | 50MB（`MAX_DOCUMENT_SIZE_MB`） | 同上 |
| 单次批量 | 20 个（`MAX_BATCH_FILES`） | 超出提示分批上传 |
| 格式 | 图片 JPG/PNG/GIF/WebP/BMP/TIFF/ICO；文档见 `src/utils/upload.ts` 白名单 | 按 `File.type` 与后端 MIME 白名单逐项对齐，避免 400 白传 |

上传失败时页面按以下顺序展示原因，保证「不会失败却无提示」：

1. 后端 JSON `detail` 原样展示（超限、格式不支持、内容损坏、磁盘满、存储目录无权限等业务错误）
2. 非 JSON 响应（反向代理/网关 HTML）按 HTTP 状态码兜底，如 413「上传内容超过服务器允许的大小」
3. 网络中断、「上传超时（等待服务器响应超过 300 秒）」、「已取消上传」分别给出独立文案
4. 进度条区分「上传中」与「服务器处理中」（图片生成 WebP / 文档落盘写库），并提供**取消**按钮；
   整请求 5 分钟看门狗，服务端无响应时主动超时提示而不是一直卡在上传中

> 若线上经由 nginx 等反向代理，请确认 `client_max_body_size` ≥ 50MB（默认仅 1MB，
> 会导致「小图能传、稍大就失败」，且返回的是代理的 HTML 413 而不是后端 JSON）。

### 正文 Markdown 约定

详情页渲染时会对相对路径自动补全前缀，后台照片/文档列表的「复制 md」生成的片段可直接粘贴进正文：

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

### 账户与权限

登录用户分两种角色（`is_superuser`，由后端 `/auth/me`、`/base/` 下发）。角色判定集中在
`src/composables/usePermissions.ts`，最终权限由后端 403 兜底：

| 能力 | 超级管理员 | 普通用户 |
|------|-----------|---------|
| 顶栏标识 | 昵称旁「超级管理员」徽章 | 「普通账号」徽章 |
| 后台文章列表 | 全站文章，可按作者筛选 | 仅本人文章（服务端强制收敛） |
| 文章 编辑/删除/恢复/推荐 | 全部文章 | 仅本人（`user_id` 匹配），他人文章操作列显示「—」 |
| 新增文章 | 可指定发布主体（作者）与发布时间 | 默认本人、服务器当前时间 |
| 编辑已有文章的分类 | 可调整 | **只读**（提交时不带 `category_ids`，保持原分类） |
| 分类管理入口/页面 | 可见、可增删改 | 不可见；直接访问 `/admin/category` 会重定向概览并提示 |
| 批量分类（加入/移出） | 可用 | 入口不渲染，接口本身也返回 403 |
| 账户管理（创建/删除/重置密码） | 可见、可操作 | 不可见；直接访问 `/admin/users` 会重定向概览并提示 |
| 照片/文档列表 | 全部，多一列「上传者」 | 仅自己上传的 |
| 照片/文档 改名/删除 | 全部 | 仅本人上传的 |
| 文档下载 | 全部 | 仅本人上传的（下载走 Blob 请求携带 JWT） |

### 账户管理说明（仅超管）

- 路由 `/admin/users`，创建的账户**密码缺省为 `abc123`**（可自定义，至少 6 位）。
- 删除账户为**硬删除**：该账户无法再登录，已签发 token 因「用户不存在」失效；
  其文章/图片/文档**保留**（作者关联变 `null`），需清理请先单独删除内容。
- 超级管理员账户受后端保护：不能删除、不能重置密码，页面也不展示其操作按钮。
- **登录名无法在列表中查看**：后端 `UserOut` 不返回 `username`（接口约定见「后端接口约定」），
  列表仅展示 `slug`——旧账户的 slug 即登录名，通过本页新建的账户 slug 为随机标识，
  登录名只在**创建成功的提示**中给出，请及时记录。

> 前台（首页/文章列表/详情/作者主页）固定以**匿名身份**读取公开数据：后端对普通账号
> token 会强制只返回本人文章，若前台沿用登录态，普通账号登录后前台将只剩自己的文章。

## 性能优化

- **路由懒加载 + Suspense**：路由组件均为动态 import，`MainLayout` / 后台 `Layout` 用
  `<Suspense>` 包裹 `RouterView`，异步阶段展示 `PageLoading` fallback。
- **首屏骨架**：`index.html` 内联加载动画，JS 加载/挂载前不白屏（Vue mount 时自动替换）。
- **封面懒加载**：`ArticleCover` 默认 `loading="lazy"` + `decoding="async"`，首屏外封面不阻塞 LCP。
- **构建分块**（`vite.config.ts` 的 `build.rollupOptions.output.manualChunks`）：`vue-core` /
  `markdown` / `http` / `date` / `carousel` / `animation` / `vendor` 独立 chunk，便于长期缓存与按需并行加载。

## 安全特性

- **XSS 防护**: Markdown 渲染使用 DOMPurify 进行 HTML 消毒
- **HTML 禁用**: markdown-it 配置 `html: false`，阻止原始 HTML 注入
- **鉴权**: 后台写接口需 JWT（`Authorization: Bearer`）；401 自动清理本地 token 并跳转登录页
- **统一错误解析**: `src/utils/apiError.ts` 将后端 `detail`（含 422 数组）解析为用户可读文案；非 JSON 错误响应按 HTTP 状态码兜底（413/502 等）、超时/断网/取消单独提示，登录/改密/各管理页/上传共用

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
