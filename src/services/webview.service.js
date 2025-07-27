// require('dotenv').config();
import axios from 'axios';

// Adjust the base URL to your backend server's address and port
// Use the BACKEND_URL to construct the backend API URL
const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/webview/`;

// Add a request interceptor to skip the ngrok browser warning
axios.interceptors.request.use(config => {
  config.headers['ngrok-skip-browser-warning'] = 'any-value';
  return config;
}, error => {
  return Promise.reject(error);
});

class WebviewService {
  getOrderData(psid, filters = {}) {
    // No auth header needed here, assuming PSID is sufficient for context
    const config = {
      headers: {
        'ngrok-skip-browser-warning': 'any-value'
      }
    };
    return axios.get(API_URL + 'order-data', { params: { psid, ...filters }, ...config });
  }

  getFeaturedData() {
    const config = {
      headers: { 'ngrok-skip-browser-warning': 'any-value' }
    };
    return axios.get(API_URL + 'featured-data', config);
  }

  getBrandData(brandId) {
    const config = {
      headers: { 'ngrok-skip-browser-warning': 'any-value' }
    };
    return axios.get(API_URL + `brand-data/${brandId}`, config);
  }

  // Send updated cart data back to the backend
  // items should be an object like { productId: quantity, ... }
  updateCart(psid, items) {
     const config = {
      headers: {
        'ngrok-skip-browser-warning': 'any-value'
      },
      params: { psid }
    };
    return axios.post(API_URL + 'update-cart', items, config);
  }

  finalizeOrder(psid) {
    const config = {
      headers: {
        'ngrok-skip-browser-warning': 'any-value'
      },
      params: { psid }
    };
    // No request body needed for finalize-order, as it uses existing cart data from customer state
    return axios.post(API_URL + 'finalize-order', {}, config);
  }
}

export default new WebviewService();
