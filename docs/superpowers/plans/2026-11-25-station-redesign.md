# 泵站信息页重设计（方案 A：单页全展开长页）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/station` 泵站页从 4-tab 切换改为 5 分节全展开长页（信息全面、UI 规范），并修复字段展示 bug、动态色类隐患与键盘快捷键失效。

**Architecture:** 单文件重构 `src/pages/Station/Index.vue`：script 侧去掉 `activeTab` 换 IntersectionObserver scrollspy（`activeSection`），`buildTabData` 修数据与空值/色类；template 侧删 tab 面板与 v-show、移动端 tab 行改锚点 chips；样式侧删 v-show 兜底 hack。数据（`src/store/station.ts` 静态 12 站）、路由、灯箱交互不变。

**Tech Stack:** Vue 3 `<script setup>` + TypeScript、Tailwind CSS 4、daisyUI、Vite 8。

**Spec:** `docs/superpowers/specs/2026-11-25-station-redesign-design.md`（本计划从该设计文档出发，执行者须先读它）

## Global Constraints

- 只改 `src/pages/Station/Index.vue`（本计划不新增 composable——scrollspy 逻辑留在该文件内，约 20 行）；**不改** `src/store/station.ts`、`src/router.ts`、后端。
- 不引入任何新依赖。
- 空值约定：`null/undefined/''` 一律渲染 `—`（含 `0`——`0` 是有效数值，不得被 `|| '—'` 吞掉）。
- 色类必须是**完整字面量**出现在源码里（Tailwind 4 扫描不到运行时拼接类名），badge/tag 用 daisyUI 静态类（`badge badge-primary` 等）。
- 项目无测试框架：验证 = `npm run build`（vue-tsc + vite，exit 0）+ 5173 手工清单。
- 提交信息用中文、遵循仓库既有风格；代码/标识符随仓库现有惯例。

## Review Focus

1. **12 站字段参差**：不同站 `shouyifanwei`/`gaizaonianfen`/`gailaoleixing` 有空有值——空值必须渲染 `—`、`0` 必须原样显示；手工切 ≥3 站核对（Task 1 Step 4 清单②③）。
2. **页底 scrollspy 卡死**：gallery 是最后一节，滚动到底时若 observer rootMargin 选得不好，最后一个锚点高亮永不触发——手工滚到底核对高亮落在「站区面貌」（Task 1 Step 4 清单④）。
3. **键盘监听泄漏**：`keydown` 必须 `onMounted` 注册 + `onUnmounted` 移除（旧代码从不移除且作用域错误）；review 核对成对出现（Task 1 Step 3）。
4. **移动端横向溢出**：chips 行含 5 项 + hero 长地址标签，窄屏（375px）不得出现整页横向滚动（Task 1 Step 4 清单⑥）。
5. **`?index=` 校验与站间切换回归**：重构不得动 `indexValue`/`prev_index`/`next_index`/无效跳首页逻辑（Task 1 Step 5 diff 核对）。

---

### Task 1: Station/Index.vue 全展开重构（script + template + style 同步）

script 与 template 必须同一次改完（分开改 `npm run build` 必挂），故为一个任务、一次提交。

**Files:**
- Modify: `src/pages/Station/Index.vue`（约 620 行，全文）

**Interfaces:**
- Consumes: 无（页面自包含；数据来自既有 `useStationStore().station_array`，30 字段见 `src/types/station.ts`）
- Produces: 无下游依赖。页面内部新状态 `activeSection: Ref<string>`（'basic'|'capacity'|'equipment'|'structure'|'gallery'）。

- [ ] **Step 1: script 数据层——修 `buildTabData` 与静态色类**

在 `src/pages/Station/Index.vue` 的 `<script setup>` 中：

1. 新增空值兜底 helper（放在 `formatNumber` 旁）：
   ```ts
   /** 空值统一渲染为 —；0 是有效值原样保留 */
   const dval = (v: unknown): string =>
       v === null || v === undefined || v === '' ? '—' : String(v);
   ```
2. **修数据 bug**：`capacity.items` 中「受益范围」一项由 `value: s.shouyimianji, unit: 'km²'` 改为 `value: dval(s.shouyifanwei), unit: ''`（`shouyifanwei` 是纯数值文本 18/26…，无单位）；「受益面积」保留 `s.shouyimianji` 单位 `万亩`。
3. `basic.items` 中 `gaizaonianfen`、`gailaoleixing` 等空值项统一走 `dval(...)`（不再 `|| '—'`，避免吞 0）；`fixedInfo` 两项不动。
4. **静态色类**：`metrics` 每项新增 `iconClass`（hero 深色底用，如 `'text-primary-300'`）与 `iconClassMobile`（浅色底用，如 `'text-primary'`），值为完整字面量；模板两处 `:class="\`text-${m.color}-300\`"` / `` :class="`text-${m.color}`" `` 改为 `m.iconClass` / `m.iconClassMobile`，`color` 字段可删除。
5. `basic.items` 中 `type: 'tag'` 的项把 `tagColor` 换成 `tagClass` 字面量（daisyUI）：泵站功能→`'badge badge-primary'`、所在流域→`'badge badge-info'`、改造类型→`'badge badge-secondary'`；模板 tag 分支的 `bg-${...}/10 text-... border-...` 三拼接改为 `:class="item.tagClass"` + `badge` 基类。

- [ ] **Step 2: script 行为层——scrollspy 替代 activeTab、快捷键入 setup**

1. 删 `const activeTab = ref<'basic'|'capacity'|'equipment'|'structure'>('basic')`，改为：
   ```ts
   /** 当前高亮分节（scrollspy 驱动） */
   const activeSection = ref('basic');
   ```
2. 新增 IntersectionObserver（放在 `scrollToSection` 定义之后）：
   ```ts
   let spy: IntersectionObserver | null = null;
   const SECTION_IDS = ['basic', 'capacity', 'equipment', 'structure', 'gallery'] as const;
   ```
   `onMounted` 里创建 `spy = new IntersectionObserver(...)`：回调取所有 `isIntersecting` 的条目，按 `SECTION_IDS` 顺序取**第一个命中者**写入 `activeSection`；`rootMargin: '-30% 0px -60% 0px'`、`threshold: 0`；对 5 个 `document.getElementById(id)` 逐个 `observe`（元素可能存在延迟渲染，观察放在 `nextTick` 后；任一为 null 跳过）。`onUnmounted` 里 `spy?.disconnect(); spy = null`。
   页底兜底：回调里若 `window.innerHeight + window.scrollY >= document.body.offsetHeight - 2`，直接置 `activeSection = 'gallery'`。
3. **修键盘快捷键**：把 template 末尾内嵌 `<script>` 块（`handleKeydown`，作用域错误、实际无效）整体删除，改到 `<script setup>`：
   ```ts
   const handleKeydown = (e: KeyboardEvent) => {
       if (!lightbox.value.open) return;
       if (e.key === 'Escape') closeLightbox();
       if (e.key === 'ArrowLeft') navigateLightbox(-1);
       if (e.key === 'ArrowRight') navigateLightbox(1);
   };
   ```
   `onMounted(() => window.addEventListener('keydown', handleKeydown))` + `onUnmounted(() => window.removeEventListener('keydown', handleKeydown))`。
4. 保留不动：`indexValue`/`watch(indexValue 跳首页)`/`prev_index`/`next_index`/`station`/`metrics` 计算、灯箱三方法、`scrollToSection`、`formatNumber`。

- [ ] **Step 3: template——删 tab 结构、chips 导航、静态类接线**

1. 4 个分节 `<section id="..." v-show="activeTab === '...'"` → 删 `v-show`（全部常显）；外层 `<div class="space-y-8" role="tabpanel" :aria-labelledby="...">` 删 `role`/`aria-labelledby`。
2. 侧栏锚点：`:class="activeTab === sec.id ? ..."` 与 `:aria-current="activeTab === sec.id ? ..."` → 换 `activeSection`。
3. 移动端 tab 行改锚点 chips：`sections.slice(0, 4)` → `sections`（5 项全上），`@click="activeTab = ..."` → `@click="scrollToSection(sec.id)"`，`:aria-selected` → 删除，`role="tab"` → 删（外层 `role="tablist"` 一并删），高亮类改 `activeSection === sec.id`；容器保留 `overflow-x-auto` 防溢出。
4. `metrics` 两处图标色类接 `m.iconClass`/`m.iconClassMobile`（见 Step 1.4）；tag 分支接 `item.tagClass`（见 Step 1.5）。
5. 删除 template 末尾整个内嵌 `<script>…</script>` 块（557-566 行附近）。
6. `<style scoped>`：删 `[v-show] { display: block !important; }` hack（已无 v-show）；其余（fade-in、灯箱过渡、打印、焦点）保留。

- [ ] **Step 4: build + 手工验证**

Run: `npm run build`
Expected: `✓ built`，exit 0（vue-tsc 类型 + 模板编译全过）。

手工清单（dev server 5173，`/?index=` 逐项）：
- ① `/station?index=0`：5 分节一次性全展开、无 tab 切换控件；侧栏 5 项点击平滑滚动。
- ② 「规模与排涝能力」中「受益范围」显示 `shouyifanwei` 的真值（如 18/26），无 km²；「受益面积」仍是 `shouyimianji` + 万亩。
- ③ 切 ≥3 个不同站（含 `gaizaonianfen` 为空的站）：空字段显示 `—`，无 `undefined`/`null` 字样。
- ④ 慢滚到页底：侧栏高亮最终落在「站区面貌」；中间滚动能依次高亮各节。
- ⑤ 灯箱开/←→切换/Esc 关闭生效（快捷键修复后应真正可用）；上一站/下一站/全部泵站跳转正常；`?index=999` 跳首页。
- ⑥ 375px 宽度：chips 行可横滑、整页无横向滚动；hero 指标卡 2 列正常。
- ⑦ 打印预览：5 分节全在、侧栏不出现。

- [ ] **Step 5: Commit**

```bash
git add src/pages/Station/Index.vue
git commit -m "feat(station): 泵站页改为单页全展开长页，修复字段展示与键盘快捷键"
```

---

### Task 2: 文档提交与收尾核验

**Files:**
- Modify: 无代码；提交已存在的两个文档

**Interfaces:** 无。

- [ ] **Step 1: 两仓库状态核对**

Run: `git status --short`（前端仓库）；`git status --short`（后端仓库）
Expected: 前端仅剩 `docs/superpowers/specs/2026-11-25-station-redesign-design.md` 与本计划文件未跟踪；后端干净（日志权限方案 A 已在 `68d91b0` 落地，勿重复改）。

- [ ] **Step 2: 提交文档**

```bash
git add docs/superpowers/specs/2026-11-25-station-redesign-design.md docs/superpowers/plans/2026-11-25-station-redesign.md
git commit -m "docs: 泵站页重设计设计文档与实施计划"
```

- [ ] **Step 3: 汇报**

向用户交付：改动摘要、build/手工验证结果、提交号、剩余风险（无自动化测试、仅 5173 手工核对）。
