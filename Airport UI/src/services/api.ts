import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For loading raw CSV/Text files which may be served statically
export const fetchStaticFile = async (path: string): Promise<string> => {
  const response = await axios.get(`${API_BASE_URL}/${path}`, {
    responseType: 'text',
  });
  return response.data;
};

// For loading JSON/GeoJSON files directly
export const fetchStaticJSON = async <T>(path: string): Promise<T> => {
  const response = await axios.get<T>(`${API_BASE_URL}/${path}`, {
    responseType: 'json',
  });
  return response.data;
};
