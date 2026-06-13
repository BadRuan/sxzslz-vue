import { defineStore } from 'pinia'
import {ref} from 'vue'

export const useUserStore = defineStore('user',() => {
    const username = ref<string>('admin')
    const nickname = ref<string>('管理员')
    const user_id = ref<string>('123123123')

    return { username, nickname, user_id}
})