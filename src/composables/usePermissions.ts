import { computed } from 'vue';
import { useAuthStore } from '@/store/auth';

/**
 * 角色权限判定（前端展示层收敛；最终权限由后端 403 兜底）。
 *
 * - 超级管理员：可查看/编辑全站文章，可管理分类（新增/编辑/删除/批量分类）。
 * - 普通账号：后台仅显示本人文章、仅能编辑本人文章；分类相关功能不可见、不可修改。
 *
 * 统一入口便于后续扩展角色（如只读账号），避免各页面散落 is_superuser 判断。
 */
export const usePermissions = () => {
    const auth_store = useAuthStore();

    const is_superuser = computed(() => auth_store.is_superuser);
    const is_normal_user = computed(() => auth_store.is_normal_user);

    /** 分类管理（分类树 CRUD、批量分类）仅超级管理员 */
    const can_manage_categories = computed(() => is_superuser.value);

    /** 是否能查看全站文章：普通账号由后端强制收敛为本人，前端也按此展示提示 */
    const can_manage_all_articles = computed(() => is_superuser.value);

    /** 单篇文章/单个上传文件是否可编辑删除：超管任意，普通账号仅本人 */
    const can_manage_article = (owner_id: number | null | undefined): boolean =>
        is_superuser.value || (owner_id != null && owner_id === auth_store.user?.id);

    return {
        is_superuser,
        is_normal_user,
        can_manage_categories,
        can_manage_all_articles,
        can_manage_article,
    };
};
