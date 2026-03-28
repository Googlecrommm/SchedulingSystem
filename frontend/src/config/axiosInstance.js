import axios from "axios";

// ← Ask your backend developer for the base URL and replace it in .env
axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.timeout = 10000;

export default axios;
