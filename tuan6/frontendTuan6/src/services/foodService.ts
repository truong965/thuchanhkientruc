import { api } from './api'
import type { Food, FoodRequest } from './types'

const getFoods = async (available?: boolean): Promise<Food[]> => {
	const response = await api.get<Food[]>('/foods', {
		params: available === undefined ? undefined : { available }
	})
	return response.data
}

const createFood = async (payload: FoodRequest): Promise<Food> => {
	const response = await api.post<Food>('/foods', payload)
	return response.data
}

const updateFood = async (id: number, payload: FoodRequest): Promise<Food> => {
	const response = await api.put<Food>(`/foods/${id}`, payload)
	return response.data
}

const deleteFood = async (id: number): Promise<void> => {
	await api.delete(`/foods/${id}`)
}

export const foodService = {
	getFoods,
	createFood,
	updateFood,
	deleteFood
}
