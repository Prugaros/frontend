import axios from 'axios';
import AuthService from './auth.service'; // To get the auth header

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/collections/`;

class CollectionService {
  // Get all collections
  getAll(params) {
    return axios.get(API_URL, { params, headers: AuthService.getAuthHeader() });
  }

  // Get a single collection by ID
  get(id) {
    return axios.get(API_URL + id, { headers: AuthService.getAuthHeader() });
  }

  // Create a new collection
  create(data) {
    return axios.post(API_URL, data, { headers: AuthService.getAuthHeader() });
  }

  // Update a collection
  update(id, data) {
    return axios.put(API_URL + id, data, { headers: AuthService.getAuthHeader() });
  }

  // Delete a collection
  delete(id) {
    return axios.delete(API_URL + id, { headers: AuthService.getAuthHeader() });
  }

  // Save the collection order
  saveOrder(order) {
    return axios.post(API_URL + 'order', { order: order }, { headers: AuthService.getAuthHeader() });
  }

  updateOrder(order) {
    return axios.post(`${API_URL}update-order`, { order }, { headers: AuthService.getAuthHeader() });
  }
}

export default new CollectionService();
