import axios from 'axios';
import AuthService from './auth.service'; // To get the auth header

// Adjust the base URL to your backend server's address and port
const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/products/`;

const UPLOAD_API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/upload/`;

class ProductService {
  // Get all products (with optional filters like activeOnly)
  getAll(filters = {}) {
    let params = {};
    let headers = AuthService.getAuthHeader();
    if (filters.psid) {
      headers = { ...headers, 'psid': filters.psid };
    }
    if (filters.activeOnly) {
      params.activeOnly = filters.activeOnly;
    }
    return axios.get(API_URL, {
      headers: headers,
      params: params
    });
  }

  // Upload images
  uploadImages(formData) {
    return axios.post(UPLOAD_API_URL + 'image', formData, {
      headers: {
        ...AuthService.getAuthHeader() // Include auth header if needed for upload endpoint. Axios will set Content-Type automatically for FormData.
      }
    });
  }

  // Get a single product by ID
  get(id) {
    return axios.get(API_URL + id, { headers: AuthService.getAuthHeader() });
  }

  // Create a new product
  // data should include { name, price, description?, images?, weight_oz?, is_active?, collectionId? }
  create(data) {
    return axios.post(API_URL, data, { headers: AuthService.getAuthHeader() });
  }

  // Update a product
  // data can include any fields to update (name, price, description?, images?, weight_oz?, is_active?, collectionId?)
  update(id, data) {
    return axios.put(API_URL + id, data, { headers: AuthService.getAuthHeader() });
  }

  // Delete a product
  delete(id) {
    return axios.delete(API_URL + id, { headers: AuthService.getAuthHeader() });
  }

  findInStock() {
    return axios.get(import.meta.env.VITE_BACKEND_URL + '/api/inventory/in-stock', { headers: AuthService.getAuthHeader() });
  }
}

const getStockLevel = (productId) => {
  return axios.get(import.meta.env.VITE_BACKEND_URL + '/api/inventory/' + productId, { headers: AuthService.getAuthHeader() });
};

const addStock = (productId, data) => {
  return axios.post(import.meta.env.VITE_BACKEND_URL + '/api/inventory/' + productId + '/add', data, { headers: AuthService.getAuthHeader() });
};

const subtractStock = (productId, data) => {
  return axios.post(import.meta.env.VITE_BACKEND_URL + '/api/inventory/' + productId + '/subtract', data, { headers: AuthService.getAuthHeader() });
};

const adjustStock = (productId, data) => {
  return axios.post(import.meta.env.VITE_BACKEND_URL + '/api/inventory/' + productId + '/adjust', data, { headers: AuthService.getAuthHeader() });
};


export { getStockLevel, addStock, subtractStock, adjustStock };
export default new ProductService();
