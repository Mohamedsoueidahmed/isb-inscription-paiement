import axios from 'axios';

/**
 * Une seule instance Axios pour toute l'application. Port 3001 par
 * défaut — le serveur académique tourne, lui, sur 3000 ; les deux
 * peuvent tourner en même temps sans conflit.
 */
const clientApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
});

clientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('tokenAcces');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

clientApi.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401 && window.location.pathname !== '/connexion') {
      localStorage.removeItem('tokenAcces');
      localStorage.removeItem('utilisateur');
      window.location.href = '/connexion';
    }
    return Promise.reject(erreur);
  }
);

export default clientApi;
