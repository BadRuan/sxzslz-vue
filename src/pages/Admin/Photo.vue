<script setup lang="ts">
import { pic_prefix } from '@/utils/baseInfo';
const pic_src = pic_prefix + 'f4b1736834f24101bf8e57b509af9933.JPG'
</script>
<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">照片管理</h2>
            <button id="uploadBtn"
                class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition">
                + 上传照片
            </button>
        </div>

        <!-- 上传区域（默认隐藏） -->
        <div id="uploadArea" class="hidden bg-white rounded-lg shadow-xs ring-1 ring-border p-6 mb-6">
            <form method="POST" action="/admin/photo/upload" enctype="multipart/form-data" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">选择照片</label>
                        <input type="file" name="image" accept="image/*" required
                            class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">照片标题</label>
                        <input type="text" name="title" placeholder="请输入照片标题" required
                            class="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">照片描述（可选）</label>
                    <input type="text" name="description" placeholder="请输入照片描述"
                        class="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">所属分组</label>
                    <select name="group"
                        class="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                        <option value="station">站点照片</option>
                        <option value="work">工作风采</option>
                        <option value="activity">活动记录</option>
                        <option value="other">其他</option>
                    </select>
                </div>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" id="cancelUpload"
                        class="rounded-md border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">取消</button>
                    <button type="submit"
                        class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition">上传</button>
                </div>
            </form>
        </div>

        <!-- 筛选栏 -->
        <div class="flex items-center gap-3 mb-4">
            <select
                class="rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">全部分组</option>
                <option value="station">站点照片</option>
                <option value="work">工作风采</option>
                <option value="activity">活动记录</option>
                <option value="other">其他</option>
            </select>
            <span class="text-sm text-gray-500">共 4 张照片</span>
        </div>

        <!-- 照片网格 -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

            <!-- 照片卡片 1 -->
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border overflow-hidden group">
                <div class="relative aspect-square overflow-hidden">
                    <img :src="pic_src" alt="泵站厂房"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div
                        class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div class="flex gap-2">
                            <button
                                class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white"
                                title="预览">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            <form method="POST" action="/admin/photo/1/delete" class="inline"
                                onsubmit="return confirm('确定删除这张照片吗？')">
                                <button type="submit"
                                    class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-red-600 hover:bg-white"
                                    title="删除">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="p-3">
                    <p class="text-sm font-medium text-gray-900 truncate">泵站厂房</p>
                    <p class="text-xs text-gray-500 mt-0.5">站点照片</p>
                </div>
            </div>

            <!-- 照片卡片 2 -->
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border overflow-hidden group">
                <div class="relative aspect-square overflow-hidden">
                    <img :src="pic_src" alt="设备运行"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div
                        class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div class="flex gap-2">
                            <button
                                class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white"
                                title="预览">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            <form method="POST" action="/admin/photo/2/delete" class="inline"
                                onsubmit="return confirm('确定删除这张照片吗？')">
                                <button type="submit"
                                    class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-red-600 hover:bg-white"
                                    title="删除">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="p-3">
                    <p class="text-sm font-medium text-gray-900 truncate">设备运行</p>
                    <p class="text-xs text-gray-500 mt-0.5">站点照片</p>
                </div>
            </div>

            <!-- 照片卡片 3 -->
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border overflow-hidden group">
                <div class="relative aspect-square overflow-hidden">
                    <img :src="pic_src" alt="站区外景"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div
                        class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div class="flex gap-2">
                            <button
                                class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white"
                                title="预览">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            <form method="POST" action="/admin/photo/3/delete" class="inline"
                                onsubmit="return confirm('确定删除这张照片吗？')">
                                <button type="submit"
                                    class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-red-600 hover:bg-white"
                                    title="删除">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="p-3">
                    <p class="text-sm font-medium text-gray-900 truncate">站区外景</p>
                    <p class="text-xs text-gray-500 mt-0.5">站点照片</p>
                </div>
            </div>

            <!-- 照片卡片 4 -->
            <div class="bg-white rounded-lg shadow-xs ring-1 ring-border overflow-hidden group">
                <div class="relative aspect-square overflow-hidden">
                    <img :src="pic_src" alt="防汛演练"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div
                        class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div class="flex gap-2">
                            <button
                                class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white"
                                title="预览">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            <form method="POST" action="/admin/photo/4/delete" class="inline"
                                onsubmit="return confirm('确定删除这张照片吗？')">
                                <button type="submit"
                                    class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-red-600 hover:bg-white"
                                    title="删除">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="p-3">
                    <p class="text-sm font-medium text-gray-900 truncate">防汛演练</p>
                    <p class="text-xs text-gray-500 mt-0.5">工作风采</p>
                </div>
            </div>

        </div>
    </main>
</template>