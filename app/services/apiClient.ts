import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@env';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(API_TIMEOUT, 10),
});

export const setAuthHeader = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const isNetworkError = (error: unknown) => {
  if (!error) {
    return false;
  }
  if (typeof error === 'object' && 'code' in error && typeof (error as { code?: string }).code === 'string') {
    const code = (error as { code?: string }).code;
    return code === 'ERR_NETWORK' || code === 'ECONNABORTED';
  }
  return false;
};
