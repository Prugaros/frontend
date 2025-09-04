import axios from 'axios';
import AuthService from './auth.service';

const API_URL = import.meta.env.VITE_BACKEND_URL + '/api/store-credit';

class StoreCreditService {
  addStoreCredit(customerId, amount, reason) {
    return axios.post(API_URL, {
      customer_id: customerId,
      amount,
      reason
    }, { headers: AuthService.getAuthHeader() });
  }

  getStoreCreditByCustomer(customerId) {
    return axios.get(API_URL + `/${customerId}`, { headers: AuthService.getAuthHeader() });
  }

  getAllCustomersWithStoreCredit() {
    return axios.get(API_URL + '/all-customers', { headers: AuthService.getAuthHeader() });
  }
}

export default new StoreCreditService();
