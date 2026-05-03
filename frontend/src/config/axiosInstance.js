import axios from "axios";

axios.defaults.baseURL = "http://localhost:8080";
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.timeout = 10000;



axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      ["token", "userName", "userRole", "departmentName"].forEach((k) =>
        localStorage.removeItem(k)
      );
      window.location.replace("/");
    }
    return Promise.reject(error);
  }
);

export default axios;