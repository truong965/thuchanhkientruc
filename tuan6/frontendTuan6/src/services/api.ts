import axios from 'axios'

const normalizeBaseUrl = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim()
  if (!trimmed) return fallback
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

const gatewayBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_GATEWAY_URL, '/api')

export const api = axios.create({
  baseURL: gatewayBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const serviceConfig = {
  gatewayBaseUrl,
  userServiceUrl: normalizeBaseUrl(import.meta.env.VITE_USER_SERVICE_URL, ''),
  foodServiceUrl: normalizeBaseUrl(import.meta.env.VITE_FOOD_SERVICE_URL, ''),
  orderServiceUrl: normalizeBaseUrl(import.meta.env.VITE_ORDER_SERVICE_URL, ''),
  paymentServiceUrl: normalizeBaseUrl(import.meta.env.VITE_PAYMENT_SERVICE_URL, '')
}
