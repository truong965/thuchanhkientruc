import { api } from './api'
import type { AuthResponse, User } from './types'

const register = async (username: string, password: string): Promise<User> => {
  const response = await api.post<User>('/auth/register', { username, password })
  return response.data
}

const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', { username, password })
  return response.data
}

export const authService = {
  register,
  login
}
