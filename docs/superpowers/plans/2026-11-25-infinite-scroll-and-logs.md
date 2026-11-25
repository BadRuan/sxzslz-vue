# 前台无限滚动 + 操作日志页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 前台文章列表与作者主页切换到后端游标接口 `GET /articles/infinite` 滚动加载，并补上后端已有、前端缺失的操作日志页 `GET /logs/`。

**Architecture:** store 新增一套独立的游标列表状态（不污染现有分页状态，后台/首页栏目继续用 `GET /articles/`）；两个前台页面用同一个 IntersectionObserver 哨兵 composable 追加加载；操作日志页为独立后台路由页，页面内直接调接口，不进 store。

**Tech Stack:** Vue 3 `<script setup>` + TS + Pinia + vue-router + daisyUI/Tailwind4 + axios（apiService）。

**Spec:** `docs/superpowers/specs/2026-11-25-article-infinite-scroll-design.md`

## Global Constraints

- 项目**没有测试框架**：每个任务的验证 = `npm run build`（vue-tsc 类型检查 + vite 打包）+ 契约 curl + 手工验证；不为此引入测试框架（超出范围）。
- 公开页（前台列表、作者主页）一律 `{ anonymous: true }`（skip_auth 匿名请求），否则登录普通账号后被后端收敛为本人文章导致串号。
- 游标 `next_cursor` 是不透明字符串，原样透传不解析；`sort`/过滤条件变化即重置。
- 后台管理列表 `Admin/ArticleList.vue`、首页栏目（`fill_latest`/`fill_by_name`）**不动**，继续 `GET /articles/`。
- 不改后端（`/articles/infinite`、`/logs/` 均已存在且实测可用）。
- 每个任务完成后提交一次 git（前端仓库）。

## Review Focus

- **登录态串号**：作者主页必须匿名请求，普通账号带 token 时后端忽略 `user_id` 只回本人文章——Task 3 的 curl 验证必须用匿名 + 带 qita token 各打一次 `user_id=5`，确认匿名返回作者 5 的文章。
- **游标翻页正确性**：同发布时间多篇不重不漏——Task 5 用 `limit=1` 连翻 3 页对比 id 序列。
- **切分类/切作者竞态**：快速切换时旧请求晚到不得覆盖新列表——fetch/loadMore 里用本地快照，回填前比对当前参数（见 Task 1 实现要点）。
- **400 无效游标降级**：伪造 cursor 不崩页面，回退首批——Task 1 覆盖。
- **普通账号越权**：qita 直接访问 `/admin/logs` 必须被重定向、侧边栏不展示——Task 4 验证。

---

### Task 1: store 游标列表能力（`src/store/article.ts`）

**Files:**
- Modify: `src/store/article.ts`（`articleService` 追加方法；store 追加状态与方法）

**Interfaces:**
- Consumes: 现有 `apiService.get`、`read_config(options)`、`ArticleSort`、`api_error_detail`、`ArticleModel`。
- Produces（Task 2/3 依赖，签名固定）:
  - 类型 `ArticleInfiniteOut { data: ArticleModel[]; limit: number; has_more: boolean; next_cursor: string | null }`
  - `articleService.getArticlesInfinite(params: { limit?: number; cursor?: string; category_id?: number; user_id?: number; sort?: ArticleSort }, options?: ArticleReadOptions): Promise<ArticleInfiniteOut>`
  - store 状态：`infinite_list: Ref<ArticleModel[]>`、`infinite_has_more: Ref<boolean>`、`infinite_loading: Ref<boolean>`（首屏）、`infinite_loading_more: Ref<boolean>`、`infinite_error: Ref<string>`（空串=无错）
  - store 方法：`resetInfiniteList(): void`、`fetchInfiniteListFirst(params: { limit?: number; category_id?: number; user_id?: number; sort?: ArticleSort }): Promise<void>`、`loadMoreInfinite(): Promise<void>`（均返回已解析的 Promise，不抛）

- [ ] **Step 1: 实现 `getArticlesInfinite` 与游标状态/方法**

`articleService` 中加方法（走 `read_config(options)`，与 `getArticles` 同款）；store 中：
- `resetInfiniteList()`：清空 `infinite_list`、`infinite_has_more=true`、`infinite_error=''`、cursor 置 null。
- `fetchInfiniteListFirst(params)`：记下本次参数快照 `infinite_key = JSON.stringify(params)`，`infinite_loading=true`，不带 cursor 请求；成功回填前比对 `infinite_key` 仍是当前值（否则丢弃，防竞态），写 list/has_more/cursor，`infinite_error` 清空；catch 时 `infinite_error = api_error_detail(error, '文章列表加载失败')`；finally 关 loading。
- `loadMoreInfinite()`：`infinite_loading_more` 在途或 `!infinite_has_more` 或首屏 loading 中 → 直接 return；带 `infinite_cursor` 请求；成功比对 key 后**追加** `data`、更新 `has_more`/`next_cursor`；catch：若 detail 含 `无效的游标` → `resetInfiniteList()` 后重新 `fetchInfiniteListFirst(上次参数)`（降级），否则 `infinite_error = api_error_detail(...)`。
- 现有分页状态与 `getArticleList` 原样保留。

- [ ] **Step 2: 类型检查**

Run: `npm run build`
Expected: `✓ built`（vue-tsc 通过，无新增报错）

- [ ] **Step 3: Commit**

```bash
git add src/store/article.ts
git commit -m "feat(article): store 增加 /articles/infinite 游标列表能力"
```

### Task 2: 新闻资讯列表页切换滚动加载

**Files:**
- Create: `src/composables/useInfiniteSentinel.ts`
- Modify: `src/pages/Article/List.vue`

**Interfaces:**
- Consumes: Task 1 的 store 状态与方法（`fetchInfiniteListFirst`/`loadMoreInfinite`/`resetInfiniteList`/`infinite_*`）。
- Produces:
  - `useInfiniteSentinel(onHit: () => void, enabled: () => boolean): Ref<HTMLElement | null>` —— 返回哨兵 ref；元素进入视口且 `enabled()` 为 true 时调 `onHit()`；组件卸载自动 disconnect。

- [ ] **Step 1: 实现 `useInfiniteSentinel` composable**

`src/composables/useInfiniteSentinel.ts`：用 `watch` 监听哨兵 ref 拿到元素后建 `IntersectionObserver`（`rootMargin: '0px 0px 300px 0px'`），相交回调里 `if (enabled()) onHit()`；`onUnmounted` disconnect。若元素先于 observer 就绪，观察时已相交会立即触发一次（正常行为，靠 `enabled()` 防重复）。

- [ ] **Step 2: 改造 `Article/List.vue`**

- 删除：`AppPagination` 导入与模板、`page_number` computed、`goToPage/goToPrevPage/goToNextPage`、watch 里的 `page_number`、`?page` 路由写入；分类点击链接只带 `query: { category }`（已是现状）。
- `PAGE_SIZE=30` 保留作 `limit`。
- watch `active_category`（immediate）：`resetInfiniteList()` → `fetchInfiniteListFirst({ category_id, limit: PAGE_SIZE, sort: 'create_at' })`；`active_category` 为 undefined 时仅 reset。
- `handleCategoryClick` 命中当前分类：同样 reset + fetch 首批（保留"点击当前分类刷新"）。
- 状态替换：模板骨架屏条件 `loading`→`infinite_loading`；错误块 `article_list_error/message`→`infinite_error`；重试按钮调 reset+fetch；空态判断 `infinite_list.length===0`；列表 `v-for` 源改 `infinite_list`（`:key` 用 `article.slug`，顺手修掉 index key）。
- 页头 `共 {{ article_total }} 条` 删除（infinite 契约无 total）。
- 列表底部追加：`<div ref="sentinel" class="h-px" aria-hidden="true" />` + 状态行——`infinite_loading_more` 时显示"加载中…"；`!infinite_has_more && infinite_list.length>0` 时显示"没有更多了"；`infinite_error` 且已有数据时显示行内"加载失败 + 重试"按钮（调 `loadMoreInfinite`）。
- `useInfiniteSentinel(() => { void article_store.loadMoreInfinite(); }, () => article_store.infinite_has_more && !article_store.infinite_loading_more && !article_store.infinite_loading)`。

- [ ] **Step 3: 类型检查**

Run: `npm run build`
Expected: `✓ built`

- [ ] **Step 4: Commit**

```bash
git add src/composables/useInfiniteSentinel.ts src/pages/Article/List.vue
git commit -m "feat(article): 新闻资讯列表切换为游标无限滚动"
```

### Task 3: 作者主页切换滚动加载

**Files:**
- Modify: `src/pages/Profile/Index.vue`

**Interfaces:**
- Consumes: Task 1 store 方法、Task 2 的 `useInfiniteSentinel`；页面内自有 `total` 取数（见下）。
- Produces: 无（叶子页面）。

- [ ] **Step 1: 改造取数与模板**

- 删除分页态（`page/has_next/go_page`、`AppPagination`）；列表源改 `infinite_list`，`:key` 改 `article.slug`。
- onMounted / `user_id` 变化：`resetInfiniteList()` → `fetchInfiniteListFirst({ user_id, limit: 20, sort: 'create_at' })`（`user_id===undefined` 时只 reset 并清 total）；保持 `{ anonymous: true }`。
- **`total` 单独轻量取数**（设计定案：infinite 无 total，但页头"共 N 篇"与名片"发布文章"是既有 UI，不能悄悄变错）：页面内 `apiService.get('/articles/', { page: 1, page_size: 1, user_id, sort: 'create_at' }, { skip_auth: true })` 取 `total` 一次，仅用于两处展示；失败时 total 显示 0 且不阻塞列表。
- 底部哨兵 + "加载中… / 没有更多了" 行，用法同 Task 2。
- `post_count` = 上述 `total`（语义从"当前页条数"变为"真实总数"，比原实现更准）。

- [ ] **Step 2: 类型检查**

Run: `npm run build`
Expected: `✓ built`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Profile/Index.vue
git commit -m "feat(profile): 作者主页切换为游标无限滚动"
```

### Task 4: 操作日志页（`GET /logs/`）

**Files:**
- Create: `src/pages/Admin/Logs.vue`
- Modify: `src/router.ts`（`/admin` children 追加）
- Modify: `src/pages/Admin/components/sidebar.vue`（系统组追加）

**Interfaces:**
- Consumes: `apiService.get`、`AppPagination`、`api_error_detail`、`usePermissions().is_superuser`（sidebar 已有）。
- Produces: 路由 `AdminLogs`（`path: 'logs'`，`meta: { title: '操作日志', requires_superuser: true }`）。

- [ ] **Step 1: 路由与侧边栏**

- `src/router.ts`：children 中追加 `{ path: 'logs', name: 'AdminLogs', component: () => import('@/pages/Admin/Logs.vue'), meta: { title: '操作日志', requires_superuser: true } }`（与 AdminCategory 同款守卫语义，放在 AdminUsers 之后）。
- `sidebar.vue`：新增 `icon_logs`（时钟/列表风格 path），系统组 `is_superuser` 分支里追加 `{ name: 'AdminLogs', label: '操作日志', icon: icon_logs }`。

- [ ] **Step 2: 实现 `Logs.vue`**

- 筛选行（daisyUI form controls）：`action`（文本，placeholder `如 create_article`）、`object_type`（文本，placeholder `article/image/document/account`）、`result`（select：空/`success`/`failed`）、`operator_id`（number，≥1）；"查询"按钮回第 1 页重查，"重置"清空。
- 状态：`page=1`、`PAGE_SIZE=20`、`rows/total/has_next/loading/error`。
- 取数：`apiService.get('/logs/', { page, page_size, ...(非空筛选字段) })`，筛选字段为空串不传参；catch → `api_error_detail(error, '日志加载失败')`。
- 表格列：时间（`date_text(created_at)`）、动作、对象类型、对象（`object_name || object_id`）、操作者（`operator_name || operator_id || '—'`）、结果（badge：success=badge-success，failed=badge-error）、IP、message（`truncate max-w-[16em]` + title）。
- 底部 `AppPagination`（unit="条"），空态"暂无日志"，错误态带重试。
- 表格用 daisyUI `table table-zebra`，容器 `rounded-box border bg-base-100`，与 UserAdmin 风格一致。

- [ ] **Step 3: 类型检查**

Run: `npm run build`
Expected: `✓ built`

- [ ] **Step 4: Commit**

```bash
git add src/pages/Admin/Logs.vue src/router.ts src/pages/Admin/components/sidebar.vue
git commit -m "feat(admin): 新增操作日志页（GET /logs/，仅超管）"
```

### Task 5: 综合验证与收尾

**Files:** 无代码改动（只验证；发现问题回到对应任务修）。

- [ ] **Step 1: 构建**

Run: `npm run build`
Expected: `✓ built`，无类型错误。

- [ ] **Step 2: 游标契约 curl（8088）**

```bash
# 首批 limit=1 → 拿 next_cursor 连翻 3 页，id 序列应严格递减且不重复
T=$(curl -s -X POST localhost:8088/auth/login -H 'Content-Type: application/json' -d '{"username":"ruanfumin","password":"admin"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
curl -s 'localhost:8088/articles/infinite?limit=1'   # 匿名首批
curl -s 'localhost:8088/articles/infinite?limit=1&cursor=<上一步next_cursor>'  # ×3
# 作者过滤（匿名）：应只含 user_id=5 的文章
curl -s 'localhost:8088/articles/infinite?user_id=5&limit=5'
# 普通账号调 /logs/ 应 403
curl -s -o /dev/null -w '%{http_code}' localhost:8088/logs/ -H "Authorization: Bearer $(curl -s -X POST localhost:8088/auth/login -H 'Content-Type: application/json' -d '{"username":"qita","password":"admin"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')"
```
Expected: 翻页不重不漏、`has_more` 收口；user_id 过滤只回作者 5；logs 普通账号 403。

- [ ] **Step 3: dev 5173 手工验证（后台 job 已有 npm run dev）**

- 未登录访问 `/article/list`：滚动到底自动追加，切分类列表重置、"没有更多了"出现；`?page=` 旧链接不再报错（忽略）。
- `/profile/5`（匿名打开）：滚动追加只显示作者 5 的文章；名片"发布文章"= 该作者真实总数。
- ruanfumin 登录：侧边栏"系统"组出现"操作日志"，可筛选/翻页；普通用户 qita 登录：无该项，直接输 `/admin/logs` 被重定向到概览（denied 提示）。

- [ ] **Step 4: Commit（如有验证期修补）**

```bash
git add -A && git commit -m "fix: 滚动加载与操作日志页验证修补"
```
（无修补则跳过。）
