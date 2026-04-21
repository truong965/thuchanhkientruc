import { api } from './api'
import type { PaymentMethod, PaymentRequest, PaymentResponse } from './types'

const pay = async (payload: PaymentRequest): Promise<PaymentResponse> => {
  const response = await api.post<PaymentResponse>('/payments', payload)
  return response.data
}

export const paymentService = {
  pay
}

export const paymentMethods: PaymentMethod[] = ['COD', 'BANKING']
