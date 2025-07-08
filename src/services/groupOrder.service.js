import axios from 'axios';
import AuthService from './auth.service'; // To get the auth header

// Adjust the base URL to your backend server's address and port
const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/group-orders/`;

class GroupOrderService {
  // Get all group orders
  getAll() {
    return axios.get(API_URL, { headers: AuthService.getAuthHeader() });
  }

  // Get a single group order by ID
  get(id) {
    return axios.get(API_URL + id, { headers: AuthService.getAuthHeader() });
  }

  // Create a new group order
  // data should include { name, start_date?, end_date?, productIds? }
  create(data) {
    return axios.post(API_URL, data, { headers: AuthService.getAuthHeader() });
  }

  // Update a group order
  // data can include { name, start_date?, end_date?, status?, productIds? }
  update(id, data) {
    return axios.put(API_URL + id, data, { headers: AuthService.getAuthHeader() });
  }

  // Delete a group order
  delete(id) {
    return axios.delete(API_URL + id, { headers: AuthService.getAuthHeader() });
  }

  // --- Special Actions ---

  // Start a group order
  start(id) {
    return axios.post(API_URL + id + '/start', {}, { headers: AuthService.getAuthHeader() });
  }

  // End a group order
  end(id) {
    return axios.post(API_URL + id + '/end', {}, { headers: AuthService.getAuthHeader() });
  }
}

export default new GroupOrderService();
