import 'vue-router';

declare module 'vue-router' {
    interface RouteMeta {
        title?: string;
        /** 仅超级管理员可进入（如分类管理） */
        requires_superuser?: boolean;
    }
}
