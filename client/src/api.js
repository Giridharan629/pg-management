import axios from 'axios';

// This automatically reads the URL from your .env file.
// When deployed to Vercel, we will feed it the live backend URL.
const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
});

export default api;