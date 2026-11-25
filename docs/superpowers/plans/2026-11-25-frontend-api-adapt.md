# frontend-api 文档适配改造计划

日期：2026-11-25
执行方式：当前会话内联执行（改动小且集中，不派子代理）

## 一、背景与目标

后端仓库 `sxzslz-server-fastapi` 于 2026-11-25 提交 825a037「补齐 stats/storage/infinite/logs 接口文档并清理遗留脚本」，并在工作区追加了若干未提交的文档微调（infinite 的 sort 默认口径、游标错误文案、logs 的 object_type 示例）。前端项目 `sxzslz-vue` 通过软链接引用该文档（`frontend-api.md`，1675 行）。

目标：逐条比对文档与前端现有实现，修正所有不一致处，使项目与新文档一致、可编译运行；全程只做读取类验证，不写入/修改/删除任何业务数据。

约束：
- 后端本地 `http://127.0.0.1:8088`，只发 GET 类读取请求（登录 POST /auth/login 为验证必需、被明确授权，除此之外不发任何写请求）。
- 测试账号：`ruanfumin`（超管）、`qita`（普通），密码均 `admin`。
- 项目无测试框架（package.json 仅 type-check / build），验证以 `vue-tsc` 类型检查 + `vite build` + 8088 只读 API 核对替代，不为此引入测试基建。

## 二、差异清单（比对结论）

### A. 必须修改（实现与文档不一致）

| # | 差异 | 文档依据 | 现状 |
|---|------|----------|------|
| A1 | 图片上传预检上限 10MB，文档与后端均为 30MB | §1 上传大小（`MAX_IMAGE_SIZE_MB=30`）、§8 大小限制；后端 `app/settings.py:15` `MAX_IMAGE_SIZE_MB: int = 30`；后端提交 469b94c「10MB → 30MB」 | `src/utils/upload.ts`：`MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024`、`MAX_IMAGE_SIZE_TEXT = '10MB'`、头注释「≤ 10MB」 |
| A2 | 关联注释仍写 10MB | 同上 | `src/pages/Admin/Photo.vue:80`、`src/pages/Admin/ArticleList.vue:289` |
| A3 | 创建/重置账户密码文案写「后端生成」，文档与后端均为 `abc123` | §2.5：缺省 `abc123`、重置为 `abc123`（`DEFAULT_USER_PASSWORD`）；后端 `app/service/user.py:111/139/152` | `src/store/auth.ts:27` 注释、`:143` 注释；`src/pages/Admin/UserAdmin.vue:15` `DEFAULT_PASSWORD_NOTICE`、`:103` 弹窗文案、`:256/:259` placeholder |
| A4 | `DELETE /users/{id}` 文档为 `204` 无响应体，前端类型声明为 `DetailResponse` | §2.5 删除账户 `204` | `src/store/auth.ts:57`（`delete_user` 本就不读返回值，仅类型改 `void`） |

### B. 不改代码，写入差异说明（文档问题或无害项）

| # | 项 | 说明 |
|---|----|------|
| B1 | `GET /auth/me` 文档 §2.2 示例缺 `is_superuser` | §1 明言「登录后从 /auth/me …判断 is_superuser」，§11 `UserOut` 含该字段，后端 `app/schema/user.py` `UserOut.is_superuser` 实际返回。实现正确，文档示例不全，不臆造。 |
| B2 | 文档下载鉴权口径矛盾 | §1 摘要写「文件下载需登录」，§9 与 §1 权限边界写「公开（无需登录）」。前端 `apiService.download` 带 Authorization 取 Blob——对公开接口无害、对需登录接口必需，两种口径都兼容，保留现状。 |
| B3 | `GET /articles/infinite`、`GET /logs/` 前端完全未调用 | 新增章节，非旧版调用；接入属新功能（无限滚动、日志页面），超出「适配」范围，列为遗留待确认。 |
| B4 | 普通账号请求带 `user_id`（Profile、Overview 最新文章） | 文档 §7：普通用户 `user_id` 被后端忽略、强制收敛为本人，传参无害且注释已说明。 |

### C. 已核对一致（不改）

- 全部请求路径尾斜杠合规（`/articles/`、`/image/`、`/document/`、`/categories/`、`/users/`、`/base/`），单资源路径无尾斜杠。
- 文章：列表参数（page/page_size/category_id/user_id/sort/is_deleted/keyword）、搜索（keyword/scope/page/page_size/category_id + elapsed_ms）、create/patch/like/restore/batch-category、前台匿名 `skip_auth`。
- 图片/文档：单/批量上传路径与字段（file/files）、列表分页、PATCH `raw_filename`、DELETE、`?file_type=raw` 原图、下载带 Token。
- 存储/统计：`GET /base/storage`（usage_percent/uploads_bytes）、`GET /articles/stats`（label/count/start_at/end_at）与 §5/§7 一致。
- 错误解析：`apiError.ts` 按 §3（detail 字符串、422 取首条 msg、状态码兜底）。
- 分页结构 `PageResponse{data,total,page,page_size,has_next}` 与 §4 一致。
- 401 处理：登录接口 `skip_auth` 不跳转，其余统一 `redirect_to_login()`，符合 §2 建议。

## 三、任务分解

1. **T1 图片上限 30MB**：`src/utils/upload.ts` 改 `MAX_IMAGE_SIZE_BYTES = 30 * 1024 * 1024`、`MAX_IMAGE_SIZE_TEXT = '30MB'`、头注释「≤ 30MB（MAX_IMAGE_SIZE_MB）」；同步 `Photo.vue:80`、`ArticleList.vue:289` 注释为 30MB。
2. **T2 密码文案 abc123**：`src/store/auth.ts` 两处注释改回「缺省 abc123」「重置为 abc123（DEFAULT_USER_PASSWORD）」；`UserAdmin.vue` 的 `DEFAULT_PASSWORD_NOTICE` 改为 `abc123`，弹窗/placeholder 文案同步（创建提示、重置提示、输入框占位）。
3. **T3 删除类型修正**：`src/store/auth.ts:57` `delete<void>`，`delete_user` 保持不读返回值。
4. **T4 编译验证**：`npm run build`（vue-tsc type-check + vite build）通过。
5. **T5 只读 API 验证**（8088）：
   - ruanfumin：POST `/auth/login` → GET `/auth/me`（含 is_superuser=true）→ GET `/base/`、`/categories/`、`/articles/?page=1`、`/articles/search?keyword=…`、`/articles/stats`、`/base/storage`、`/image/?page_size=1`、`/document/?page_size=1`；附加 GET `/logs/?page_size=5`（超管，验证新增章节可用）、GET `/articles/infinite?limit=1`。
   - qita：登录 → GET `/auth/me`（is_superuser=false）、`/articles/`（收敛为本人）、`/image/`、`/articles/stats`（scope=half_month）；GET `/logs/` 应 403（验证权限边界）。
   - 全程仅 GET + 登录 POST，不发任何写请求。
6. **T6 输出交付**：变更清单 / 差异说明 / 验证结果 / 遗留风险四段结论。

## 四、自审

- 改动只落在 4 个文件的常量、注释、文案与一个泛型参数，不引入新依赖、不改请求封装逻辑。
- `IMAGE_LIMIT_HINT`、`validate_images` 错误文案均由常量拼接，改常量即全量生效，无遗漏文案。
- 不触碰未提交的 UI 重构改动（Station/Index.vue 等），保持其原样。
- 风险：30MB 预检放宽后，>10MB 图片将放行到后端（后端本就接受 30MB，行为正确）。

## 五、交接

按 T1→T6 顺序执行；T5 若 8088 未启动则先确认后端状态，只读验证不通过时按 systematic-debugging 排查，不改后端。
