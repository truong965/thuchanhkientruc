import { api } from './api'
import type { Order, OrderRequest } from './types'

const getOrders = async (userId?: string): Promise<Order[]> => {
	const response = await api.get<Order[]>('/orders', {
		params: userId ? { userId } : undefined
	})
	return response.data
}

const createOrder = async (payload: OrderRequest): Promise<Order> => {
	const response = await api.post<Order>('/orders', payload)
	return response.data
}

const updateStatus = async (id: number, status: string): Promise<Order> => {
	const response = await api.patch<Order>(`/orders/${id}/status`, { status })
	return response.data
}

export const orderService = {
	getOrders,
	createOrder,
	updateStatus
}
