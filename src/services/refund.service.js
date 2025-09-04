import axios from 'axios';
import AuthService from './auth.service';

const API_URL = import.meta.env.VITE_BACKEND_URL + '/api/refunds';

class RefundService {
  createRefund(order_id, product_id, quantity, price) {
    return axios.post(API_URL, {
      order_id,
      product_id,
      quantity,
      price
    }, { headers: AuthService.getAuthHeader() });
  }

  getPendingRefunds() {
    return axios.get(API_URL + '/pending', { headers: AuthService.getAuthHeader() });
  }

  updateRefundState(id, state) {
    return axios.put(API_URL + `/${id}`, {
      state
    }, { headers: AuthService.getAuthHeader() });
  }
}

export default new RefundService();
