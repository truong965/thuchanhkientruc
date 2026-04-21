export type UserRole = 'USER' | 'ADMIN'

export type User = {
  id: string
  username: string
  role: UserRole
  createdAt: string
}

export type AuthResponse = {
  token: string
  user: User
}

export type Food = {
  id: number
  name: string
  description: string
  price: number
  category: string
  available: boolean
  imageUrl?: string
}
 
export type FoodRequest = {
  name: string
  description: string
  price: number
  category: string
  available: boolean
  imageUrl?: string
}
 
export type OrderItemRequest = {
  foodId: number
  quantity: number
}
 
export type OrderItemResponse = {
  foodId: number
  foodName: string
  foodPrice: number
  quantity: number
  subtotal: number
}
 
export type OrderRequest = {
  userId: string
  token: string
  items: OrderItemRequest[]
}
 
export type Order = {
  id: number
  userId: string
  userName: string
  status: string
  totalAmount: number
  createdAt: string
  items: OrderItemResponse[]
}

export type PaymentMethod = 'COD' | 'BANKING'

export type PaymentRequest = {
  orderId: number
  userId: string
  method: PaymentMethod
}


export type PaymentResponse = {
  status: 'SUCCESS' | 'FAILED'
  message: string
}
 