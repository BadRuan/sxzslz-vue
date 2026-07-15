import { ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';

export interface UserModel {
    id: number,
    nickname: string,
}

class UserService{
    public getUserArray() {
        return apiService.get('/user/')
    }
}

const userService = new UserService();

export const useUserStore = defineStore('user', () => {
  const users = ref<UserModel[]>([])
  const loading = ref(false)

  const getUsers = async () => {
    loading.value = true
    try {
      const res = await userService.getUserArray()
      users.value = res.data
    } catch (error) {
      console.error('获取用户列表:', error)
    } finally {
      loading.value = false
    }
  }
  return { users, getUsers, loading }
})
