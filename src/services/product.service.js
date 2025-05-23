import axios from 'axios';
import AuthService from './auth.service'; // To get the auth header

// Adjust the base URL to your backend server's address and port
const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api/products/`;

class ProductService {
  // Get all products (with optional filters like activeOnly)
  getAll(filters = {}) {
    return axios.get(API_URL, {
        headers: AuthService.getAuthHeader(),
        params: filters
     });
  }

  // Get a single product by ID
  get(id) {
    return axios.get(API_URL + id, { headers: AuthService.getAuthHeader() });
  }

  // Create a new product
  // data should include { name, price, description?, image_url?, weight_oz?, is_active? }
  create(data) {
    // TODO: Handle image upload separately if not just providing URL
    return axios.post(API_URL, data, { headers: AuthService.getAuthHeader() });
  }

  // Update a product
  // data can include any fields to update
  update(id, data) {
     // TODO: Handle image upload separately if not just providing URL
    return axios.put(API_URL + id, data, { headers: AuthService.getAuthHeader() });
  }

  // Delete a product
  delete(id) {
    return axios.delete(API_URL + id, { headers: AuthService.getAuthHeader() });
  }
}

export default new ProductService();
