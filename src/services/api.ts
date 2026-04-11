import axios from 'axios';
import { notifyError } from '../utils/toast';

export const api = axios.create({
  baseURL: 'https://dev.codeleap.co.uk/careers/',
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Transaction failed. Please try again.';
    notifyError(message);
    return Promise.reject(error);
  }
);