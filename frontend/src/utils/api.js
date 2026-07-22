import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

// Otomatis menyisipkan Token JWT ke setiap request jika user sudah login
api.interceptors.request.use((config) => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
        const { token } = JSON.parse(userInfo);
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Menangani respon error 401 (token expired / invalid) untuk logout otomatis
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const isLoginRequest = error.config && error.config.url && error.config.url.includes("/auth/login");
            if (!isLoginRequest) {
                localStorage.removeItem("userInfo");
                window.location.href = "/";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
