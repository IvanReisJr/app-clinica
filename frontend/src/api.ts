import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8001/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para injetar o Token JWT em todas as requisições protegidas
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para Refresh Token Automático nas Repostas 401
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (refreshToken) {
                    const response = await axios.post('http://127.0.0.1:8001/api/auth/token/refresh/', {
                        refresh: refreshToken
                    });

                    // Salva os novos tokens recuperados
                    localStorage.setItem('access_token', response.data.access);
                    // Alguns setups também podem devolver um novo refresh token:
                    if (response.data.refresh) {
                        localStorage.setItem('refresh_token', response.data.refresh);
                    }

                    // Atualiza o header da requisição original e refaz ela
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Se tentou fazer o refresh e falhou (Refresh Token morto), apagar tudo e kickar
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
