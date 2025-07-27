import axios from 'axios';
import AuthService from './auth.service';

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/brands`;

class BrandService {
  getAll() {
    return axios.get(API_URL, { headers: AuthService.getAuthHeader() });
  }

  get(id) {
    return axios.get(`${API_URL}/${id}`, { headers: AuthService.getAuthHeader() });
  }

  create(data) {
    return axios.post(API_URL, data, { headers: AuthService.getAuthHeader() });
  }

  update(id, data) {
    return axios.put(`${API_URL}/${id}`, data, { headers: AuthService.getAuthHeader() });
  }

  delete(id) {
    return axios.delete(`${API_URL}/${id}`, { headers: AuthService.getAuthHeader() });
  }

  updateOrder(order) {
    return axios.post(`${API_URL}/update-order`, { order }, { headers: AuthService.getAuthHeader() });
  }
}

export default new BrandService();
