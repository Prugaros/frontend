import axios from 'axios';
import AuthService from './auth.service';

const API_URL = import.meta.env.VITE_BACKEND_URL + '/api/orders';

const getGroupOrders = () => {
  const user = AuthService.getCurrentUser();
  const token = user?.accessToken;

  return axios.get(API_URL + '/purchase-list', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

const getPurchaseListForGroupOrder = (groupOrderId) => {
  const user = AuthService.getCurrentUser();
  const token = user?.accessToken;

  return axios.get(API_URL + `/purchase-list/${groupOrderId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    withCredentials: true
  });
};

const getPurchaseOrdersForGroupOrder = (groupOrderId) => {
  const user = AuthService.getCurrentUser();
  const token = user?.accessToken;

  return axios.get(API_URL + `/${groupOrderId}/purchase-orders`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

const purchaseListService = {
  getGroupOrders,
  getPurchaseListForGroupOrder,
  getPurchaseOrdersForGroupOrder
};

export default purchaseListService;
