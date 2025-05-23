import axios from 'axios';

// Adjust the base URL to your backend server's address and port
// Make sure it matches the port defined in your backend's .env file (e.g., 3001)
const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api/auth/`;

class AuthService {
  async login(username, password) {
    try {
      const response = await axios.post(API_URL + 'login', {
        username,
        password,
      });
      if (response.data.accessToken) {
        // Store user info and JWT in local storage
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error; // Re-throw error to be handled by the component
    }
  }

  logout() {
    // Remove user info from local storage
    localStorage.removeItem('user');
    // Optionally: redirect to login page or refresh
    window.location.reload(); // Simple reload, better routing can be implemented
  }

  getCurrentUser() {
    // Retrieve user info from local storage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  getAuthHeader() {
    // Helper function to get the auth token for API requests
    const user = this.getCurrentUser();
    if (user && user.accessToken) {
      // Standard format for JWT token in Authorization header
      return { Authorization: 'Bearer ' + user.accessToken };
      // Or if your backend expects 'x-access-token':
      // return { 'x-access-token': user.accessToken };
    } else {
      return {};
    }
  }
}

// Export an instance of the class
export default new AuthService();
