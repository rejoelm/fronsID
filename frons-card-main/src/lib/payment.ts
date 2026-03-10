export interface OrderData {
  fronsciesUsername: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  quantity: number;
}

export interface PaymentResponse {
  success: boolean;
  payment_url?: string;
  payment_id?: string;
  order_id?: string;
  error?: string;
}

export async function createPayment(orderData: OrderData): Promise<PaymentResponse> {
  try {
    const orderId = `FRONSCIERS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const amount = orderData.quantity * 225000; // IDR 225,000 per card

    const paymentRequest = {
      orderId,
      amount,
      customerName: orderData.fullName,
      customerEmail: orderData.email,
      customerPhone: orderData.phone,
      address: orderData.address,
      city: orderData.city,
      state: orderData.state,
      postalCode: orderData.postalCode,
      quantity: orderData.quantity,
      fronsciesUsername: orderData.fronsciesUsername
    };

    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentRequest)
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Payment creation failed'
      };
    }

    return {
      success: true,
      payment_url: result.payment_url,
      payment_id: result.payment_id,
      order_id: result.order_id
    };

  } catch (error) {
    console.error('Payment creation error:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}

export async function checkPaymentStatus(paymentId: string) {
  try {
    const response = await fetch(`/api/payment/status?payment_id=${paymentId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to check payment status');
    }

    return result;
  } catch (error) {
    console.error('Payment status check error:', error);
    throw error;
  }
}