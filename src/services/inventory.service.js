import axios from 'axios';
import AuthService from './auth.service'; // To get the auth header

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/inventory/`;

const findInStock = () => {
  return axios.get(API_URL + 'in-stock', { headers: AuthService.getAuthHeader() });
};

export { findInStock };

const shipmentIntake = (groupOrderId, receivedItems) => {
  const user = AuthService.getCurrentUser();
  const token = user?.accessToken;

  return axios.post(`${API_URL}${groupOrderId}/shipment-intake`, receivedItems, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

const getShipmentIntakeList = (groupOrderId) => {
  const user = AuthService.getCurrentUser();
  const token = user?.accessToken;

  return axios.get(`${API_URL}${groupOrderId}/shipment-intake`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export default { findInStock, shipmentIntake, getShipmentIntakeList };
