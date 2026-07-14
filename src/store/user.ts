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

  const getUsers = async () => {
    try {
      const res = await userService.getUserArray()
      users.value = res.data
    } catch (error) {
      console.error('获取用户列表:', error)
    }
  }
  return { users, getUsers }
})
