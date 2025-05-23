import axios from 'axios';

// Adjust the base URL to your backend server's address and port
// Use the BACKEND URL for API calls from the webview
const API_URL = 'https://0660-2601-2c5-200-9ae0-7c71-1414-2012-b8b.ngrok-free.app/api/webview/';

class WebviewService {
  // Get initial data for the webview (products, current cart)
  getOrderData(psid) {
    // No auth header needed here, assuming PSID is sufficient for context
    return axios.get(API_URL + 'order-data', { params: { psid } });
  }

  // Send updated cart data back to the backend
  // items should be an object like { productId: quantity, ... }
  updateCart(psid, items) {
    return axios.post(API_URL + 'update-cart', { items }, { params: { psid } });
  }

}

export default new WebviewService();
