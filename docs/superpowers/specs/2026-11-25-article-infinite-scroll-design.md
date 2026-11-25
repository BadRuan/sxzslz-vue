# 前台文章列表切换无限滚动（GET /articles/infinite）+ 操作日志页（GET /logs/）设计

日期：2026-11-25

## 背景与意图

后端已把前台文章列表的正式加载方式调整为游标式无限滚动 `GET /articles/infinite`
（对接文档 §7）：`GET /articles/` 的 `page` 分页只保留给后台管理列表、回收站与搜索定位。
前端目前前台两处列表仍在用传统分页，与后端契约不一致，需要匹配。

## 目标 / 非目标

- 目标：
  1. 新闻资讯列表页（`src/pages/Article/List.vue`）改为无限滚动；
  2. 作者主页文章列表（`src/pages/Profile/Index.vue`）改为无限滚动；
  3. 游标契约正确：首屏不传 `cursor`，滚动追加 `next_cursor`，`has_more=false` 到底，切分类/作者时重置。
- 非目标：
  - 后台管理列表 `src/pages/Admin/ArticleList.vue` 保留 `GET /articles/` 分页（文档明确）；
  - 首页栏目（`fill_latest` / `fill_by_name`）保留 `page=1` 取首批（非页面流，已与需求方确认）；
  - 不改后端（`GET /articles/infinite` 已存在且实测可用）；
  - 不动搜索页 `/articles/search`（本就是独立接口）。

## 方案比较

| 方案 | 说明 | 取舍 |
|------|------|------|
| A. IntersectionObserver 哨兵（选定） | 列表底部哨兵元素进入视口自动拉下一批 | 移动端友好、代码集中；需要处理哨兵观察与重置 |
| B. window 滚动事件 + 节流 | 滚动到底触发 | 效果等价，代码更多、易抖动 |
| C. 底部「加载更多」按钮 | 手动触发 | 最省事，但不是滚动加载 |

选定 A：需求即"滚动加载"，A 最贴合且实现量可控。

## 设计

### 数据层（`src/store/article.ts`）

- 新增 `ArticleInfiniteOut` 类型：`{ data: ArticleModel[], limit: number, has_more: boolean, next_cursor: string | null }`。
- `articleService` 新增 `getArticlesInfinite(params, options)` → `GET /articles/infinite`，
  参数 `limit / cursor / category_id / user_id / sort`，公开页传 `{ anonymous: true }`（skip_auth）。
- store 新增游标列表状态与方法（独立于现有分页状态，避免互相污染）：
  - 状态：`infinite_list`（当前累计文章）、`infinite_cursor`、`infinite_has_more`、`infinite_loading`（首屏）、`infinite_loading_more`（追加）、`infinite_error`；
  - `resetInfiniteList()`：清空累计与游标；
  - `fetchInfiniteListFirst(params)`：不带 cursor 取首批并覆盖列表；
  - `loadMoreInfinite()`：带 `next_cursor` 追加；`has_more=false` 或加载中时 no-op；
  - 并发保护：追加请求在途时忽略重复触发。
- 现有 `getArticleList`（分页）保留，供后台与首页栏目继续使用。

### 视图层

- `Article/List.vue`：
  - 移除 `AppPagination`、`?page=` 路由与 `goToPage/goToPrevPage/goToNextPage`；
  - 分类切换（`active_category` 变化）→ `resetInfiniteList()` + 取首批；
  - 列表底部渲染哨兵 `<div ref>` + `IntersectionObserver`（`rootMargin` 预留约 300px），
    进入视口且 `has_more && !loading` 时 `loadMoreInfinite()`；
  - 到底展示「没有更多了」；失败展示重试按钮（复用现有 error 展示位）。
  - 保留现有"点击当前分类刷新"行为：重置后取首批。
- `Profile/Index.vue`：
  - 同样移除分页条，`user_id` 作为过滤参数走 `GET /articles/infinite?user_id=`（匿名请求，避免登录态收敛串号——沿用现有注释里的约束）；
  - 哨兵滚动加载，切作者（路由 id 变化）时重置。

### 不变式 / 边界

- 公开页一律 `skip_auth` 匿名请求：普通账号带 token 时后端会把列表收敛为本人，导致串号（现有注释已记录此坑）。
- 游标不透明字符串原样透传，不解析；`sort`/过滤条件变化即重置。
- `400 无效的游标` 视为不可恢复：清空游标回退到首批重取（降级），并提示错误。

## 验证

- `npm run build`（vue-tsc type-check）通过。
- 8088 curl：`GET /articles/infinite?limit=5`（匿名/登录）首批 + `cursor` 翻页不重不漏、`has_more` 收口；
  `GET /articles/infinite?user_id=<qita>` 匿名按作者过滤。
- dev 起 5173 手工验证：滚动追加、切分类重置、作者主页滚动加载、到底提示。

---

## 附：后端接口 ↔ 前端功能/界面对照复核（2026-11-25）

对后端 OpenAPI 全量路径逐一核对前端调用与界面，结论：

| 后端接口 | 前端对应 | 结论 |
|---|---|---|
| /auth/login /me /password | Login.vue、store/auth、Admin/Password | ✅ |
| /users/ POST、/{id}/reset-password、DELETE | Admin/UserAdmin | ✅ |
| /categories/ GET/POST/PATCH/DELETE | Admin/CategoryEdit | ✅ |
| /articles/ GET(分页)、detail、search、stats、POST/PATCH/DELETE、like、restore、batch-category | 前台/后台各页面 | ✅ |
| /articles/**infinite** | 无 | ❌ 缺口 1（本文上半部分） |
| /image/ /document/ GET、POST 单/批量、PATCH 重命名、DELETE | Admin/Photo、Admin/Document、MarkdownEditor | ✅ |
| /base/、/base/storage | store/base、Admin/Overview | ✅ |
| /logs/ GET（仅超管） | **无任何调用、无界面** | ❌ 缺口 2（下方新增设计） |

### 缺口 2 设计：操作日志页 `GET /logs/`

- **意图**：后端已有审计日志查询（文档 §10，仅超管），前端完全没有入口，管理员看不到"谁在什么时候改了什么"。补一个后台页面。
- **路由**：`/admin/logs`（name: `AdminLogs`），`meta: { title: '操作日志', requires_superuser: true }`
  ——与分类/账户管理同款守卫：普通账号侧边栏不展示，直接访问被重定向到 `/admin/overview?denied=superuser`。
- **界面**（`src/pages/Admin/Logs.vue`，风格沿用 UserAdmin/Photo 的 daisyUI 表格）：
  - 顶部筛选行：操作类型 action（文本/下拉）、对象类型 object_type、结果 result（success/failed）、操作者 operator_id；
    筛选变化回到第 1 页重查。
  - 表格列：时间 created_at、动作 action、对象类型 object_type、对象 object_name（object_id 兜底）、
    操作者 operator_name、结果 result（badge，failed 高亮）、IP client_ip、补充 message（过长省略+title）。
  - 底部 `AppPagination` 传统分页（`PageResponse`：page/page_size/has_next/total_pages），page_size 20。
  - 401 走既有拦截器跳登录；403（理论上路由守卫已拦）显示错误提示。
- **取数**：`apiService.get('/logs/', { page, page_size, action, object_type, result, operator_id })`，写在页面内（一次性简单调用，不进 store）。
- **不改后端**：接口已存在且实测可用（admin 200 / 普通用户 403 文案与文档一致）。
- **验证**：build 通过；admin 登录可见侧边栏项并能翻页/筛选，qita 登录看不到该项且直接访问被重定向。
