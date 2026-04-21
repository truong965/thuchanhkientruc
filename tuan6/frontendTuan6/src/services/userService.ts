import { api } from './api'
import type { User } from './types'

const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/users/me')
  return response.data
}

const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users')
  return response.data
}

export const userService = {
  getMe,
  getUsers
}
