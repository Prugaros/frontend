import axios from 'axios';
import { authHeader } from './auth.service';

const API_URL = '/api/';

const getDestashList = () => {
    return axios.get(API_URL + 'customers/destash-list', { headers: authHeader() });
};

const getCustomerStatus = (psid) => {
    return axios.get(API_URL + `customers/status/${psid}`);
};

const updateDestashNotification = (psid) => {
    return axios.patch(API_URL + `customers/destash-notification/${psid}`);
};

export default {
    getDestashList,
    getCustomerStatus,
    updateDestashNotification
};
