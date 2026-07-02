import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
    const username = ref('')
    const nickname = ref('')
    const user_id = ref('')

    const is_logged_in = computed(() => !!username.value)

    function login(info: { username: string; nickname: string; user_id: string }) {
        username.value = info.username
        nickname.value = info.nickname
        user_id.value = info.user_id
    }

    function logout() {
        username.value = ''
        nickname.value = ''
        user_id.value = ''
    }

    return { username, nickname, user_id, is_logged_in, login, logout }
})
