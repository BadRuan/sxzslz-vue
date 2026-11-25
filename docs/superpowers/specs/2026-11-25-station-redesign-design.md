# 泵站信息页重设计（方案 A：单页全展开长页）设计文档

日期：2026-11-25 ｜ 状态：待批准 ｜ 用户需求：重新设计路由 /station 的泵站信息展示，信息展示全面、UI 设计规范。

## 1. 背景与目标

现状 `src/pages/Station/Index.vue`（约 620 行）用 4 个 tab（基本情况 / 规模与排涝能力 / 机电设备 / 房建与压力箱）切换展示，信息被切碎、无法一眼看全，也打印不全；存在数据展示 bug 与空值处理不统一的问题。

目标：
1. **信息全面**：去掉 tab，5 个分节全部展开成长页，所有字段一屏流式可见、可打印。
2. **UI 规范**：统一 daisyUI 组件与现有设计令牌（card-hover / shadow-card / base 分层 / eyebrow / TitleComponent），修复动态拼接色类在 Tailwind 4 下不生效的隐患。
3. 修复已知数据展示 bug。

## 2. 范围

- **只改** `src/pages/Station/Index.vue` 一个文件（若 scrollspy 需拆 composable 可新增 `src/composables/useSectionSpy.ts`）。
- **不改**：路由（`/station?index=N` 不变）、`src/store/station.ts` 静态数据（12 站）、后端（无 station 接口，本次不建）、首页入口、灯箱交互。
- 顺带修复：template 内嵌 `<script>` 键盘快捷键（详见 §5.4）。

## 3. 页面结构（自上而下）

1. **Hero（保留，微调）**：背景图 + 站名 + 标签 chips（地址/建站年份/流域/水系/圩口）+ 桌面端右侧 4 指标卡与站间导航（上一站/全部泵站/下一站）。移动端指标卡仍在内容区顶部展示。
2. **侧栏锚点导航（桌面端 sticky，保留）**：5 项（基本情况/规模与排涝能力/机电设备/房建与压力箱/站区面貌），高亮改为 IntersectionObserver **scrollspy**（不再依赖 activeTab）。
3. **移动端锚点 chips（替换原 tab 行）**：横向滚动 chips，点击平滑滚动到分节——只做导航，不隐藏任何内容。
4. **5 个分节全部常显**（去掉所有 `v-show="activeTab === ..."`）：
   - **#basic 基本情况**：9 项（名称/地址/建站年份/改造年份/改造类型/功能/流域/水系/圩口）+ 固定归属（主管部门、管理单位）。
   - **#capacity 规模与排涝能力**：8 项指标卡。**修 bug**：「受益范围」原错用 `shouyimianji` 且标 km²，改用真字段 `shouyifanwei`（纯数值文本，无单位）；「受益面积」继续用 `shouyimianji`（万亩）。
   - **#equipment 机电设备**：变压器 / 电机 / 水泵 各类型+型号。
   - **#structure 房建与压力箱**：主机泵房 / 管理房 / 压力箱 各子项。
   - **#gallery 站区面貌**：图库网格 + 灯箱（交互不变）。

## 4. UI 规范细则

- **卡片统一**：分组卡统一 `card-hover rounded-xl border border-base-300 bg-base-100 shadow-[var(--shadow-card)]`，节标题统一走 `TitleComponent`（first=中文标题，second=英文副题）。
- **空值统一**：`buildTabData` 内所有 value 统一经兜底函数，`null/undefined/''` 一律渲染 `—`（现状部分直渲 undefined）。
- **数值格式**：数值用 `num` + `tabular-nums` + `formatNumber`（千分位，最多 2 位小数）。
- **修动态色类隐患**：现状 `:class="'text-' + m.color + '-300'"`、`bg-${item.tagColor}/10` 这类运行时拼接类名，Tailwind 4 扫描不到、颜色实际可能不生效。改为**静态映射**（如 `metricIconColor: { primary: 'text-primary-300', ... }` 或直接在数据里写死完整类名），badge/tag 用 daisyUI `badge badge-primary` 等静态类。
- **打印**：现有 `@media print` 样式保留；全展开后天然整页可打印（删掉 v-show 隐藏）。

## 5. 行为变更

1. **scrollspy**：IntersectionObserver 观察 5 个 section，`rootMargin` 顶部留 sticky 偏移（约 `-30% 0px -60% 0px`），更新 `activeSection` 驱动侧栏高亮；点击锚点仍 `scrollIntoView + history.replaceState('#id')`。
2. **站间切换 / `?index=` 校验 / 无效索引跳首页**：逻辑不变。
3. **灯箱**（打开/切换/关闭）：不变。
4. **修复键盘快捷键**：template 末尾内嵌 `<script>` 里的 `handleKeydown` 不在 setup 作用域（`onMounted`/`closeLightbox` 等不可达），快捷键实际无效且每次渲染产生全局错误。改为在 `<script setup>` 中 `onMounted` 注册、`onUnmounted` 移除 `keydown` 监听（Esc/←/→）。

## 6. 验证

- `npm run build`（vue-tsc + vite）通过。
- 5173 手工核对：5 分节全展开无 tab、侧栏/移动端 chips 锚点滚动且高亮跟随、受益范围显示 `shouyifanwei` 值、空字段显示 —、灯箱与上下站切换正常、Esc/方向键快捷键生效、移动端布局不横向溢出。
- 打印预览整页完整。

## 7. 不做的事（明确排除）

- 不建后端 station 接口、不把静态数据挪后端（如需另立项）。
- 不做「列表 → 详情」两级结构（方案 C）。
- 不改 12 站数据内容本身，不新增字段。
