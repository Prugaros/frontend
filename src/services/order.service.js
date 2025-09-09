import axios from 'axios';
import AuthService from './auth.service'; // To get the auth header

// Adjust the base URL to your backend server's address and port
const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/orders/`;

class OrderService {
  // Get all orders (with optional filters)
  // filters is an object like { groupOrderId: 1, paymentStatus: 'Paid' }
  getAll(filters = {}) {
    return axios.get(API_URL, {
      headers: AuthService.getAuthHeader(),
      params: filters // Pass filters as query parameters
    });
  }

  // Get a single order by ID
  get(id) {
    return axios.get(API_URL + id, { headers: AuthService.getAuthHeader() });
  }

  // Update shipping manifest details for a group order
  updateShippingManifest(group_order_id, data) {
    return axios.put(API_URL + 'shipment-manifest/' + group_order_id, data, { headers: AuthService.getAuthHeader() });
  }

  // Update payment status for an order
  // status should be one of the allowed values ('Paid', 'Cancelled', etc.)
  updatePaymentStatus(id, status) {
    return axios.put(API_URL + id + '/payment-status', { payment_status: status }, { headers: AuthService.getAuthHeader() });
  }

  triggerPaymentVerification(id) {
    return axios.post(API_URL + id + '/trigger-payment-verification', {}, { headers: AuthService.getAuthHeader() });
  }

  markAsPaid(customerId, groupOrderId) {
    return axios.post(API_URL + 'mark-as-paid', { customerId, groupOrderId }, { headers: AuthService.getAuthHeader() });
  }

  // Export orders as CSV
  // filters should include { groupOrderId, packageType }
  exportCsv(filters) {
    // We expect the backend to return the CSV data directly
    // The browser will handle the download based on Content-Disposition header
    return axios.get(API_URL + 'export/csv', {
        headers: AuthService.getAuthHeader(),
        params: filters,
        responseType: 'blob' // Important for handling file download
    });
  }

  // Helper to trigger download in browser
  downloadCsvFile(blobData, filename) {
    const url = window.URL.createObjectURL(new Blob([blobData]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename); // Use the filename from backend if possible, or generate one
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getShipmentManifest(group_order_id) {
    return axios.get(API_URL + 'shipment-manifest/' + group_order_id, { headers: AuthService.getAuthHeader() });
  }
}

export default new OrderService();
