<template>
    <main class="bg-background font-sans">
        <div class="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden">
            <!-- 背景装饰 -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5"></div>
            <div class="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2">
            </div>
            <div class="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/2">
            </div>

            <div class="w-full max-w-md relative z-10">
                <!-- Logo -->
                <div class="text-center mb-8">
                    <img src="/icon/water-logo.svg" class="h-12 mx-auto mb-4" alt="logo" />
                    <h1 class="text-2xl font-bold text-gray-900">芜湖市鸠江区沈巷镇水利站</h1>
                    <p class="text-sm text-gray-500 mt-1">后台管理系统</p>
                </div>

                <!-- 登录框 -->
                <div class="bg-white rounded-xl shadow-lg ring-1 ring-border/50 p-8">
                    <form>
                        <div class="space-y-5">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                                <input type="text" placeholder="请输入用户名"
                                    class="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
                                <input type="password" placeholder="请输入密码"
                                    class="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                            </div>

                            <div class="flex items-center justify-between">
                                <label class="flex items-center text-sm">
                                    <input type="checkbox"
                                        class="rounded border-gray-300 text-primary focus:ring-primary/40" />
                                    <span class="ml-2">记住我</span>
                                </label>
                                <a href="#" class="text-sm text-primary hover:underline">忘记密码？</a>
                            </div>

                            <button type="submit"
                                class="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition shadow-sm">
                                登录系统
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    </main>
</template>