import { jwtDecode } from 'jwt-decode';

export interface AuthUser {
  userId: number;
  name: string;
  username: string;
  role: 'USER' | 'ADMIN';
  exp: number;
  iat: number;
}

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const getUser = (): AuthUser | null => {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<AuthUser>(token);
    // Kiểm tra token hết hạn
    if (Date.now() >= decoded.exp * 1000) {
      removeToken();
      return null;
    }
    return decoded;
  } catch (error) {
    removeToken();
    return null;
  }
};
