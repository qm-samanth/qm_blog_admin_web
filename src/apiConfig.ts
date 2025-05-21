// src/apiConfig.ts
// Centralized API base URL for the project

// Handles both Vite/CRA and browser global fallback
let API_BASE_URL = 'http://localhost:1337/api';
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
} else if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL) {
  API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
} else if (typeof window !== 'undefined' && (window as any).REACT_APP_API_BASE_URL) {
  API_BASE_URL = (window as any).REACT_APP_API_BASE_URL;
}

export default API_BASE_URL;
