import axios from 'axios';
import AuthService from './auth.service';

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/group-orders`;

const BroadcastService = {
  /**
   * Fetch the number of subscribers who will receive the broadcast.
   * @returns {Promise<{ count: number }>}
   */
  getSubscriberCount() {
    return axios.get(`${BASE_URL}/broadcast/subscriber-count`, {
      headers: AuthService.getAuthHeader(),
    });
  },

  /**
   * Send a custom broadcast email.
   * @param {{ subject: string, bodyText: string, featuredImageUrl?: string }} data
   * @returns {Promise<{ message: string, sent: number }>}
   */
  send(data) {
    return axios.post(`${BASE_URL}/broadcast`, data, {
      headers: AuthService.getAuthHeader(),
    });
  },
};

export default BroadcastService;
