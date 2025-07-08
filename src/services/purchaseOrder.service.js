import axios from 'axios';
import AuthService from './auth.service';

const API_URL = import.meta.env.VITE_BACKEND_URL + '/api/orders';

const createPurchaseOrder = (groupOrderId, purchaseOrderItems) => {
  const user = AuthService.getCurrentUser();
  const token = user?.accessToken;

  return axios.post(API_URL + `/${groupOrderId}/purchase-orders`, { items: purchaseOrderItems }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

const purchaseOrderService = {
  createPurchaseOrder
};

export default purchaseOrderService;
